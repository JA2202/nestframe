type FrameColour = "oak" | "walnut" | "black" | "white";
type PrintType = "FRAMED_PRINT" | "PRINT_ONLY";

const VARIANT_MAP: Record<string, number> = {
  // Fill these from Shopify variant IDs
  // key format: `${printType}|${size}|${frameColour}`
  // Example:
  // "FRAMED_PRINT|45x30|oak": 1234567890,
};

export function getVariantId(input: {
  printType: PrintType;
  size: string;
  frameColour: FrameColour;
}) {
  return VARIANT_MAP[`${input.printType}|${input.size}|${input.frameColour}`] ?? null;
}