// lib/printfulVariantMap.ts
export type PrintType = "FRAMED_PRINT" | "PRINT_ONLY" | "CANVAS";
export type FrameColour = "black" | "white" | "none";

const PRINTFUL_CATALOG_VARIANT_MAP: Record<string, number> = {
  // FRAMED_PRINT (black/white)
  "FRAMED_PRINT|8x10|black": 4651,
  "FRAMED_PRINT|8x10|white": 10754,

  "FRAMED_PRINT|10x10|black": 4652,
  "FRAMED_PRINT|10x10|white": 10755,

  "FRAMED_PRINT|11x14|black": 14292,
  "FRAMED_PRINT|11x14|white": 14293,

  "FRAMED_PRINT|12x16|black": 1350,
  "FRAMED_PRINT|12x16|white": 10751,

  "FRAMED_PRINT|12x18|black": 4398,
  "FRAMED_PRINT|12x18|white": 10752,

  "FRAMED_PRINT|18x24|black": 3,
  "FRAMED_PRINT|18x24|white": 10749,

  "FRAMED_PRINT|24x36|black": 4,
  "FRAMED_PRINT|24x36|white": 10750,

  // PRINT_ONLY (poster) uses |none
  "PRINT_ONLY|8x10|none": 6871,
  "PRINT_ONLY|10x10|none": 6872,
  "PRINT_ONLY|11x14|none": 14028,
  "PRINT_ONLY|12x12|none": 6873,
  "PRINT_ONLY|12x16|none": 6875,
  "PRINT_ONLY|12x18|none": 6876,
  "PRINT_ONLY|14x14|none": 6874,
  "PRINT_ONLY|16x16|none": 6877,
  "PRINT_ONLY|16x20|none": 6878,
  "PRINT_ONLY|18x18|none": 6879,
  "PRINT_ONLY|18x24|none": 6880,
  "PRINT_ONLY|20x30|none": 19524,
  "PRINT_ONLY|24x36|none": 7845,

  // CANVAS uses |none
  "CANVAS|8x10|none": 17620,
  "CANVAS|9x12|none": 17623,
  "CANVAS|11x14|none": 17621,
  "CANVAS|12x12|none": 15701,
  "CANVAS|12x16|none": 15702,
  "CANVAS|12x18|none": 17622,
  "CANVAS|16x16|none": 15703,
  "CANVAS|16x20|none": 15704,
  "CANVAS|18x24|none": 15705,
  "CANVAS|20x28|none": 17624,
  "CANVAS|20x30|none": 17626,
  "CANVAS|24x32|none": 17625,
  "CANVAS|24x36|none": 15706,
};

function normaliseFrame(
  printType: PrintType,
  frame: string | null | undefined
): FrameColour {
  if (printType !== "FRAMED_PRINT") return "none";
  if (frame === "black") return "black";
  return "white";
}

export function getPrintfulCatalogVariantId(input: {
  printType: PrintType;
  size: string;
  frameColour?: string | null;
}): number | null {
  const frame = normaliseFrame(input.printType, input.frameColour);
  const key = `${input.printType}|${input.size}|${frame}`;
  const id = PRINTFUL_CATALOG_VARIANT_MAP[key];
  return typeof id === "number" ? id : null;
}