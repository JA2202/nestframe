// app/api/custom-variant/default/route.ts
import { NextResponse } from "next/server";
import { getCustomDefaultVariant } from "@/lib/products";

export async function GET() {
  const data = await getCustomDefaultVariant();

  if (!data) {
    return NextResponse.json(
      { error: "No custom default variant configured" },
      { status: 500 }
    );
  }

  const { product, variant } = data;

  return NextResponse.json({
    productId: product.id,
    productTitle: product.title,
    variant: {
      id: variant.id,
      format: variant.format,
      sizeLabel: variant.size_label,
      frameColor: variant.frame_color,
      basePriceCents: variant.base_price_cents,
    },
  });
}