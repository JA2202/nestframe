"use client";

import { useCart } from "./CartProvider";

type Props = {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  variantId: string;
  format: string;
  sizeLabel: string;
  frameColor: string | null;
  unitPriceCents: number;
};

export function AddToCartButton(props: Props) {
  const { addItem } = useCart();

  const handleClick = () => {
    addItem(
      {
        productId: props.productId,
        productTitle: props.productTitle,
        imageUrl: props.imageUrl,
        variantId: props.variantId,
        format: props.format,
        sizeLabel: props.sizeLabel,
        frameColor: props.frameColor,
        unitPriceCents: props.unitPriceCents,
        source: "catalogue",
        generatedArtId: null,
      },
      1
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full md:w-auto inline-flex items-center justify-center rounded-md bg-nf-primary text-white px-6 py-2 text-sm font-medium"
    >
      Add to cart
    </button>
  );
}