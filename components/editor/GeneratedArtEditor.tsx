"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { Area } from "react-easy-crop";
import { addToShopifyCart } from "@/lib/shopifyBridge";
import { getVariantId } from "@/lib/shopifyVariantMap";

type Shape = "square" | "tall" | "wide";

type Props = {
  id: string;
  imageUrl: string;
  initialCrop: unknown;
  initialShape: unknown;

  // New: restore saved config when re-opening the editor
  initialSize?: unknown;
  initialFrameColour?: unknown;
  initialPrintType?: unknown;
};

type PrintType = "FRAMED_PRINT" | "PRINT_ONLY" | "CANVAS";
type FrameColour = "black" | "white" | "none";

type SizeOption = {
  value: string;
  label: string;
  helper?: string;
};

function shapeToAspect(shape: Shape): number {
  if (shape === "wide") return 1536 / 1024; // 1.5
  if (shape === "tall") return 1024 / 1536; // 0.666...
  return 1;
}

function parseSizeKey(value: string): { w: number; h: number } | null {
  const m = /^(\d+)\s*x\s*(\d+)$/.exec(value.trim());
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

function formatSizeLabel(size: string, shape: Shape): string {
  const dims = parseSizeKey(size);
  if (!dims) return size;

  const { w, h } = dims;

  if (shape === "wide") return `${h}" × ${w}"`;
  return `${w}" × ${h}"`;
}

function aspectForSize(size: string, shape: Shape): number {
  const dims = parseSizeKey(size);
  if (!dims) return shapeToAspect(shape);

  const { w, h } = dims;
  if (w === h) return 1;

  // For "wide" we treat the print as rotated (landscape)
  if (shape === "wide") return h / w;
  return w / h;
}

const SIZES_BY_PRINT_TYPE: Record<PrintType, string[]> = {
  FRAMED_PRINT: ["8x10", "10x10", "11x14", "12x16", "12x18", "18x24", "24x36"],
  PRINT_ONLY: [
    "8x10",
    "10x10",
    "11x14",
    "12x12",
    "12x16",
    "12x18",
    "14x14",
    "16x16",
    "16x20",
    "18x18",
    "18x24",
    "20x30",
    "24x36",
  ],
  CANVAS: [
    "8x10",
    "9x12",
    "11x14",
    "12x12",
    "12x16",
    "12x18",
    "16x16",
    "16x20",
    "18x24",
    "20x28",
    "20x30",
    "24x32",
    "24x36",
  ],
};

const FRAME_OPTIONS: { value: Exclude<FrameColour, "none">; label: string; swatchClass: string }[] =
  [
    { value: "black", label: "Black Oak", swatchClass: "bg-[#1F1F1F]" },
    { value: "white", label: "White Oak", swatchClass: "bg-white" },
  ];

// Simple pricing placeholder for now (GBP). Real pricing is Shopify at checkout.
const PRICE_BY_SIZE_GBP: Record<string, number> = {
  // Existing cm keys (kept)
  "30x45": 39,
  "40x60": 49,
  "50x75": 69,
  "60x90": 89,
  "45x30": 39,
  "60x40": 49,
  "75x50": 69,
  "90x60": 89,
  "30x30": 35,
  "40x40": 45,
  "50x50": 65,
  "60x60": 85,
};

function formatGBP(amount: number): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `£${Math.round(amount)}`;
  }
}

function coercePrintType(v: unknown): PrintType | null {
  if (v === "FRAMED_PRINT" || v === "PRINT_ONLY" || v === "CANVAS") return v;
  return null;
}

function coerceFrameColour(v: unknown): FrameColour | null {
  if (v === "black" || v === "white" || v === "none") return v;
  // Back-compat: previously defaulted "oak" in UI, treat it as White Oak for framed
  if (v === "oak") return "white";
  return null;
}

function coerceSize(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export default function GeneratedArtEditor({
  id,
  imageUrl,
  initialCrop,
  initialShape,
  initialSize,
  initialFrameColour,
  initialPrintType,
}: Props) {
  const router = useRouter();
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const shapeFromDb: Shape | null =
    initialShape === "wide" || initialShape === "tall" || initialShape === "square"
      ? (initialShape as Shape)
      : null;

  const initialShapeState: Shape = shapeFromDb ?? "square";

  const savedPrintType = coercePrintType(initialPrintType);
  const savedSize = coerceSize(initialSize);
  const savedFrame = coerceFrameColour(initialFrameColour);

  const [shape, setShape] = useState<Shape>(initialShapeState);

  const [printType, setPrintType] = useState<PrintType>(savedPrintType ?? "FRAMED_PRINT");
  const [frameColour, setFrameColour] = useState<FrameColour>(() => {
    const pt = savedPrintType ?? "FRAMED_PRINT";
    if (pt !== "FRAMED_PRINT") return "none";
    if (savedFrame === "black" || savedFrame === "white") return savedFrame;
    return "white";
  });

  const sizeOptions = useMemo<SizeOption[]>(() => {
    const raw = SIZES_BY_PRINT_TYPE[printType] ?? [];

    const filtered =
      shape === "square"
        ? raw.filter((s) => {
            const d = parseSizeKey(s);
            return !!d && d.w === d.h;
          })
        : raw.filter((s) => {
            const d = parseSizeKey(s);
            return !!d && d.w !== d.h;
          });

    return filtered.map((s) => ({
      value: s,
      label: formatSizeLabel(s, shape),
    }));
  }, [printType, shape]);

  const [size, setSize] = useState<string>(() => {
    // Prefer restored size if it exists in current option set
    const pt = savedPrintType ?? "FRAMED_PRINT";
    const raw = SIZES_BY_PRINT_TYPE[pt] ?? [];
    const initialCandidate = savedSize && raw.includes(savedSize) ? savedSize : raw[0] ?? "";

    // Apply shape filter (square vs non-square) to pick a valid default
    const isValidForShape = (s: string) => {
      const d = parseSizeKey(s);
      if (!d) return false;
      if (shapeFromDb === "square" || (!shapeFromDb && initialShapeState === "square")) return d.w === d.h;
      return d.w !== d.h;
    };

    if (initialCandidate && isValidForShape(initialCandidate)) return initialCandidate;

    const fallback = raw.find(isValidForShape);
    return fallback ?? "";
  });

  const [aspect, setAspect] = useState<number>(aspectForSize(size, initialShapeState));

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollToOptions = () => {
    optionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Infer shape from the actual generated image (works for base64 + hosted URLs)
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const a = img.naturalWidth / img.naturalHeight;

        // Update shape if DB didn't have it
        if (!shapeFromDb) {
          const inferred: Shape = a > 1.2 ? "wide" : a < 0.85 ? "tall" : "square";
          setShape(inferred);
        }
      }
    };
  }, [imageUrl, shapeFromDb]);

  // Ensure frameColour matches printType
  useEffect(() => {
    if (printType !== "FRAMED_PRINT") {
      if (frameColour !== "none") setFrameColour("none");
      return;
    }
    if (frameColour === "none") setFrameColour("white");
  }, [printType, frameColour]);

  // Keep size valid when printType/shape changes
  useEffect(() => {
    if (!sizeOptions.some((o) => o.value === size)) {
      setSize(sizeOptions[0]?.value ?? "");
    }
  }, [sizeOptions, size]);

  // Keep crop aspect aligned to selected size + orientation
  useEffect(() => {
    if (!size) return;
    setAspect(aspectForSize(size, shape));
  }, [size, shape]);

  // Restore crop if present
  useEffect(() => {
    if (!initialCrop || typeof initialCrop !== "object") return;
    const c = initialCrop as Record<string, unknown>;
    const cc = c.crop as { x?: number; y?: number } | undefined;
    const z = c.zoom as number | undefined;
    const a = c.aspect as number | undefined;
    const cap = c.croppedAreaPixels as Area | undefined;

    if (cc && typeof cc.x === "number" && typeof cc.y === "number") setCrop({ x: cc.x, y: cc.y });
    if (typeof z === "number") setZoom(z);
    if (typeof a === "number") setAspect(a);
    if (cap && typeof cap.width === "number") setCroppedAreaPixels(cap);
  }, [initialCrop]);

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const price = useMemo(() => {
    const base = PRICE_BY_SIZE_GBP[size] ?? 39;
    return base;
  }, [size]);

  const persistCrop = async () => {
    const priceCents = Math.round((PRICE_BY_SIZE_GBP[size] ?? 39) * 100);

    const res = await fetch(`/api/generated-art/${id}/crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop,
        zoom,
        croppedAreaPixels,
        aspect,
        shape,

        // product config
        size,
        frameColour: printType === "FRAMED_PRINT" ? frameColour : null,
        printType,
        priceCents,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to save crop");
    }
  };

  const saveCrop = async () => {
    setErrorMsg(null);
    setAddedMsg(null);

    if (!croppedAreaPixels) {
      setErrorMsg("Please adjust the crop first.");
      return;
    }

    setSaving(true);
    try {
      await persistCrop();
      router.refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to save crop");
    } finally {
      setSaving(false);
    }
  };

  const addToCart = async () => {
    setErrorMsg(null);
    setAddedMsg(null);

    if (!croppedAreaPixels) {
      setErrorMsg("Please adjust the crop first.");
      return;
    }

    setAdding(true);
    try {
      // Ensure crop + config is saved first
      await persistCrop();

      const priceCents = Math.round((PRICE_BY_SIZE_GBP[size] ?? 39) * 100);

      const variantId = getVariantId({
        printType,
        size,
        frameColour,
      });

      if (!variantId) {
        throw new Error("Missing Shopify variant mapping for this selection.");
      }

      await addToShopifyCart(
        [
          {
            id: variantId,
            quantity: 1,
            properties: {
              nf_art_id: id,
              nf_size: size,
              nf_frame_colour: String(frameColour),
              nf_print_type: printType,
              nf_price_cents: String(priceCents),
            },
          },
        ],
        { redirectToCheckout: true }
      );

      setAddedMsg("Added to cart.");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const selectedSizeLabel = sizeOptions.find((s) => s.value === size)?.label ?? size;

  const selectedFrameLabel =
    printType === "FRAMED_PRINT"
      ? FRAME_OPTIONS.find((f) => f.value === frameColour)?.label ?? String(frameColour)
      : printType === "CANVAS"
      ? "Canvas"
      : "No frame";

  return (
    <div className="min-h-screen bg-nf-bg pb-24 lg:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading text-nf-ink">Crop your artwork</h1>
            <p className="text-sm text-nf-text-muted mt-1">
              Adjust the crop so it fits perfectly in your chosen layout.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="text-sm text-nf-text-muted hover:text-nf-text"
          >
            Back to create
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="bg-nf-surface border border-nf-border rounded-xl p-4">
            <div className="relative w-full h-[52vh] md:h-[60vh] max-h-[720px] overflow-hidden rounded-xl bg-nf-grey100">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs text-nf-text-muted">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <aside
            ref={optionsRef}
            className="bg-nf-surface border border-nf-border rounded-xl p-4 space-y-5 lg:sticky lg:top-24 h-fit"
          >
            <div>
              <h2 className="text-base font-semibold text-nf-text">Make it yours</h2>
              <p className="text-xs text-nf-text-muted mt-1">
                Choose frame type and size, then add to cart.
              </p>
            </div>

            <div>
              <p className="text-xs text-nf-text-muted mb-2">Frame type</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "PRINT_ONLY" as const, label: "No frame" },
                    { value: "FRAMED_PRINT" as const, label: "Framed" },
                    { value: "CANVAS" as const, label: "Canvas" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrintType(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      printType === opt.value
                        ? "border-nf-primary bg-nf-primary-soft"
                        : "border-nf-border bg-white hover:bg-nf-grey100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-nf-text-muted mb-2">Size (inches)</p>
              <div className="grid grid-cols-2 gap-2">
                {sizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSize(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      size === opt.value
                        ? "border-nf-primary bg-nf-primary-soft"
                        : "border-nf-border bg-white hover:bg-nf-grey100"
                    }`}
                  >
                    <div className="font-medium text-nf-text">{opt.label}</div>
                    {opt.helper && (
                      <div className="mt-0.5 text-[11px] text-nf-text-muted">{opt.helper}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {printType === "FRAMED_PRINT" && (
              <div>
                <p className="text-xs text-nf-text-muted mb-2">Frame colour</p>
                <div className="grid grid-cols-2 gap-2">
                  {FRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFrameColour(opt.value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm flex items-center gap-3 ${
                        frameColour === opt.value
                          ? "border-nf-primary bg-nf-primary-soft"
                          : "border-nf-border bg-white hover:bg-nf-grey100"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-sm border border-nf-border ${opt.swatchClass}`}
                      />
                      <span className="font-medium text-nf-text">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-nf-border pt-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-nf-text">Total</p>
                  <p className="text-[11px] text-nf-text-muted">
                    {selectedSizeLabel} · {selectedFrameLabel}
                  </p>
                </div>
                <p className="text-sm font-semibold text-nf-text">{formatGBP(price)}</p>
              </div>

              {errorMsg && <p className="text-xs text-nf-error">{errorMsg}</p>}
              {addedMsg && <p className="text-xs text-nf-text-muted">{addedMsg}</p>}

              <button
                type="button"
                onClick={addToCart}
                disabled={adding || saving}
                className="w-full inline-flex items-center justify-center rounded-md bg-nf-primary text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
              >
                {adding ? "Adding to cart..." : "Add to cart"}
              </button>

              <button
                type="button"
                onClick={saveCrop}
                disabled={saving || adding}
                className="w-full inline-flex items-center justify-center rounded-md border border-nf-border bg-white text-nf-text px-6 py-2 text-sm font-medium hover:bg-nf-grey100 disabled:opacity-60"
              >
                {saving ? "Saving crop..." : "Save crop"}
              </button>

              <p className="text-[11px] text-nf-text-muted">
                Your crop is saved with your artwork so it stays frame-ready.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-nf-border bg-nf-surface lg:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={scrollToOptions}
            className="rounded-md border border-nf-border bg-white px-3 py-2 text-sm font-medium text-nf-text hover:bg-nf-grey100"
          >
            Options
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-nf-text-muted">Total</p>
            <p className="text-sm font-semibold text-nf-text truncate">{formatGBP(price)}</p>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={adding || saving}
            className="rounded-md bg-nf-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {adding ? "Adding..." : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}