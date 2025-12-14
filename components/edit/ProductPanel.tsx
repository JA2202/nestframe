"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// If your cart hook lives somewhere else, adjust this import.
// Keeping it typed loosely so it won’t block you on exact cart types.
import { useCart } from "@/components/cart/CartProvider";

type Layout = "tall" | "wide" | "square";

type FrameColour = "oak" | "black" | "white";

type SizeOption = {
  id: string;
  label: string;       // e.g. "30×40"
  layout: Layout;
  // store for later (Shopify/Printful mapping)
  widthCm: number;
  heightCm: number;
  basePrice: number;   // print-only price
};

const SIZES: SizeOption[] = [
  // Tall (portrait)
  { id: "30x40", label: "30×40", layout: "tall", widthCm: 30, heightCm: 40, basePrice: 29 },
  { id: "40x50", label: "40×50", layout: "tall", widthCm: 40, heightCm: 50, basePrice: 39 },
  { id: "50x70", label: "50×70", layout: "tall", widthCm: 50, heightCm: 70, basePrice: 55 },

  // Wide (landscape)
  { id: "40x30", label: "40×30", layout: "wide", widthCm: 40, heightCm: 30, basePrice: 29 },
  { id: "60x40", label: "60×40", layout: "wide", widthCm: 60, heightCm: 40, basePrice: 49 },
  { id: "90x60", label: "90×60", layout: "wide", widthCm: 90, heightCm: 60, basePrice: 89 },

  // Square
  { id: "30x30", label: "30×30", layout: "square", widthCm: 30, heightCm: 30, basePrice: 29 },
  { id: "50x50", label: "50×50", layout: "square", widthCm: 50, heightCm: 50, basePrice: 55 },
  { id: "70x70", label: "70×70", layout: "square", widthCm: 70, heightCm: 70, basePrice: 89 },
];

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function frameAddOn(frame: FrameColour) {
  // simple placeholder pricing (we can swap for real Printful/Shopify variant pricing later)
  if (frame === "oak") return 30;
  if (frame === "black") return 25;
  return 25; // white
}

export default function ProductPanel(props: {
  artId: string;
  imageUrl: string;
  layout: Layout;
  setLayout: (l: Layout) => void;

  cropSaved: boolean;
  savingCrop: boolean;
  onSaveCrop: () => Promise<void>;

  // whatever your editor tracks (percentages, pixels, etc)
  cropData: unknown;
}) {
  const router = useRouter();
  const cart = useCart() as any;

  const sizeOptions = useMemo(
    () => SIZES.filter((s) => s.layout === props.layout),
    [props.layout]
  );

  const [sizeId, setSizeId] = useState<string>(() => {
    // default to first size for this layout
    const first = SIZES.find((s) => s.layout === props.layout);
    return first?.id ?? "30x40";
  });

  const [frame, setFrame] = useState<FrameColour>("oak");
  const [qty, setQty] = useState<number>(1);
  const [adding, setAdding] = useState(false);

  // keep sizeId valid when layout changes
  const activeSize = useMemo(() => {
    const found = sizeOptions.find((s) => s.id === sizeId);
    return found ?? sizeOptions[0];
  }, [sizeId, sizeOptions]);

  const price = useMemo(() => {
    const base = activeSize?.basePrice ?? 0;
    const framePrice = frameAddOn(frame);
    return (base + framePrice) * qty;
  }, [activeSize, frame, qty]);

  const onAddToCart = async () => {
    if (!props.cropSaved) return;

    setAdding(true);
    try {
      // Adjust this payload to match your cart structure.
      // Keeping it explicit so it’s easy to map to Shopify later.
      const item = {
        key: `${props.artId}:${activeSize.id}:${frame}`,
        artId: props.artId,
        title: "Custom wall art",
        imageUrl: props.imageUrl,
        layout: props.layout,
        crop: props.cropData,
        size: {
          id: activeSize.id,
          label: activeSize.label,
          widthCm: activeSize.widthCm,
          heightCm: activeSize.heightCm,
        },
        frame,
        unitPrice: (activeSize.basePrice + frameAddOn(frame)),
        qty,
        total: price,
      };

      if (typeof cart?.addItem === "function") {
        cart.addItem(item);
      } else if (typeof cart?.addToCart === "function") {
        cart.addToCart(item);
      } else {
        throw new Error("Cart integration is missing addItem/addToCart.");
      }

      router.push("/cart");
    } catch (e) {
      console.error(e);
      // You can surface a toast here later. Keeping behaviour minimal.
      alert(e instanceof Error ? e.message : "Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <aside className="md:sticky md:top-6 space-y-4">
      <div className="bg-nf-surface rounded-xl border border-nf-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-nf-text">Your print</h2>
            <p className="mt-1 text-xs text-nf-text-muted">
              Choose size and frame, then add to cart.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-nf-text">{formatGBP(price)}</div>
            <div className="text-[11px] text-nf-text-muted">incl. frame</div>
          </div>
        </div>

        {/* Layout */}
        <div className="mt-4">
          <div className="text-xs font-medium text-nf-text-muted mb-2">Layout</div>
          <div className="grid grid-cols-3 gap-2">
            {(["tall", "wide", "square"] as Layout[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  props.setLayout(l);
                  const first = SIZES.find((s) => s.layout === l);
                  if (first) setSizeId(first.id);
                }}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  props.layout === l
                    ? "border-nf-primary bg-nf-primary-soft"
                    : "border-nf-border bg-white hover:bg-nf-grey100"
                }`}
              >
                {l === "tall" ? "Tall" : l === "wide" ? "Wide" : "Square"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-nf-text-muted">
            This only changes the crop window. Your original generation stays the same.
          </p>
        </div>

        {/* Save crop */}
        <div className="mt-4">
          <button
            type="button"
            onClick={props.onSaveCrop}
            disabled={props.savingCrop}
            className="w-full rounded-md bg-nf-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {props.savingCrop ? "Saving crop..." : props.cropSaved ? "Crop saved" : "Save crop"}
          </button>
          {!props.cropSaved && (
            <p className="mt-2 text-[11px] text-nf-text-muted">
              Save your crop before adding to cart.
            </p>
          )}
        </div>

        {/* Size */}
        <div className="mt-5">
          <div className="text-xs font-medium text-nf-text-muted mb-2">Size</div>
          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeId(s.id)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  activeSize?.id === s.id
                    ? "border-nf-primary bg-nf-primary-soft"
                    : "border-nf-border bg-white hover:bg-nf-grey100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-nf-text-muted">cm</p>
        </div>

        {/* Frame colour */}
        <div className="mt-5">
          <div className="text-xs font-medium text-nf-text-muted mb-2">Frame colour</div>
          <div className="flex gap-2">
            {(["oak", "black", "white"] as FrameColour[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFrame(c)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                  frame === c
                    ? "border-nf-primary bg-nf-primary-soft"
                    : "border-nf-border bg-white hover:bg-nf-grey100"
                }`}
              >
                {c === "oak" ? "Oak" : c === "black" ? "Black" : "White"}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-nf-text-muted">Quantity</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-9 w-9 rounded-md border border-nf-border bg-white hover:bg-nf-grey100"
            >
              −
            </button>
            <div className="min-w-[32px] text-center text-sm">{qty}</div>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              className="h-9 w-9 rounded-md border border-nf-border bg-white hover:bg-nf-grey100"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to cart */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!props.cropSaved || adding}
            className="w-full rounded-md bg-black text-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {adding ? "Adding to cart..." : "Add to cart"}
          </button>

          <div className="mt-3 space-y-1 text-[11px] text-nf-text-muted">
            <div>Printed in the UK</div>
            <div>Frame-ready, no borders</div>
            <div>Secure checkout</div>
          </div>
        </div>
      </div>
    </aside>
  );
}