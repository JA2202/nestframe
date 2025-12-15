// lib/shopifyVariantMap.ts

type FrameColour = "oak" | "walnut" | "black" | "white" | "none";
type PrintType = "FRAMED_PRINT" | "PRINT_ONLY" | "CANVAS";

const VARIANT_MAP: Record<string, number> = {
  // FRAMED_PRINT (Shopify frame colours: Black Oak / White Oak)
  "FRAMED_PRINT|8x10|black": 57573832229245,
  "FRAMED_PRINT|10x10|black": 57576713748861,
  "FRAMED_PRINT|11x14|black": 57576713814397,
  "FRAMED_PRINT|12x16|black": 57576713879933,
  "FRAMED_PRINT|12x18|black": 57576713945469,
  "FRAMED_PRINT|18x24|black": 57576714011005,
  "FRAMED_PRINT|24x36|black": 57576714076541,

  "FRAMED_PRINT|8x10|white": 57576710275453,
  "FRAMED_PRINT|10x10|white": 57576713781629,
  "FRAMED_PRINT|11x14|white": 57576713847165,
  "FRAMED_PRINT|12x16|white": 57576713912701,
  "FRAMED_PRINT|12x18|white": 57576713978237,
  "FRAMED_PRINT|18x24|white": 57576714043773,
  "FRAMED_PRINT|24x36|white": 57576714109309,

  // PRINT_ONLY (Non-framed) uses "|none"
  "PRINT_ONLY|8x10|none": 57576793506173,
  "PRINT_ONLY|10x10|none": 57576793538941,
  "PRINT_ONLY|11x14|none": 57576793571709,
  "PRINT_ONLY|12x12|none": 57576793604477,
  "PRINT_ONLY|12x16|none": 57576793637245,
  "PRINT_ONLY|12x18|none": 57576793670013,
  "PRINT_ONLY|14x14|none": 57576793702781,
  "PRINT_ONLY|16x16|none": 57576793735549,
  "PRINT_ONLY|16x20|none": 57576793768317,
  "PRINT_ONLY|18x18|none": 57576793801085,
  "PRINT_ONLY|18x24|none": 57576793833853,
  "PRINT_ONLY|20x30|none": 57576793866621,
  "PRINT_ONLY|24x36|none": 57576793899389,

  // CANVAS uses "|none"
  "CANVAS|8x10|none": 57576813461885,
  "CANVAS|9x12|none": 57576813494653,
  "CANVAS|11x14|none": 57576813527421,
  "CANVAS|12x12|none": 57576813560189,
  "CANVAS|12x16|none": 57576813592957,
  "CANVAS|12x18|none": 57576813625725,
  "CANVAS|16x16|none": 57576813658493,
  "CANVAS|16x20|none": 57576813691261,
  "CANVAS|18x24|none": 57576813724029,
  "CANVAS|20x28|none": 57576813756797,
  "CANVAS|20x30|none": 57576813789565,
  "CANVAS|24x32|none": 57576813822333,
  "CANVAS|24x36|none": 57576813855101,
};

function normaliseFrameColour(
  printType: PrintType,
  frameColour: FrameColour
): FrameColour {
  // Non-framed + canvas have no frame option
  if (printType !== "FRAMED_PRINT") return "none";

  // Your app currently uses "oak" as a default. For framed products, map it to Shopify "White Oak".
  if (frameColour === "oak") return "white";

  // Only black/white are valid for framed in Shopify
  return frameColour;
}

export function getVariantId(input: {
  printType: PrintType;
  size: string;
  frameColour: FrameColour;
}) {
  const frame = normaliseFrameColour(input.printType, input.frameColour);

  const exact = VARIANT_MAP[`${input.printType}|${input.size}|${frame}`];
  if (typeof exact === "number") return exact;

  // Fallback for PRINT_ONLY + CANVAS or if caller sent an unsupported frame colour
  const fallback = VARIANT_MAP[`${input.printType}|${input.size}|none`];
  return typeof fallback === "number" ? fallback : null;
}