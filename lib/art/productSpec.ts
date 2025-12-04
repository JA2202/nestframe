// /lib/art/productSpec.ts

/** ---------- Product & Option Types ---------- */
export type ProductType = "poster" | "framed" | "canvas";
export type FrameColor = "black" | "white" | "natural";
export type Orientation = "portrait" | "landscape" | "auto";
export type FitMode = "fit" | "fill";

/** A size like "12x16" in inches. */
export type SizeKey =
  // Posters/Framed (shared)
  | "5x7" | "8x10" | "10x10" | "11x14" | "12x12" | "12x16" | "12x18"
  | "14x14" | "16x16" | "16x20" | "18x18" | "18x24" | "20x30" | "24x36"
  // Canvas (many, includes overlaps)
  | "6x6" | "8x8" | "8x12" | "9x12" | "10x20" | "12x24" | "12x36"
  | "16x24" | "16x32" | "16x48" | "18x26" | "20x20" | "20x24" | "20x28"
  | "20x40" | "20x60" | "24x24" | "24x30" | "24x32" | "24x48" | "26x26"
  | "26x40" | "28x28" | "28x40" | "30x30" | "30x40" | "30x60" | "32x32"
  | "32x48" | "36x36" | "37x37" | "40x55" | "40x60";

/** Canonical size definition (finished/actual product size in inches). */
export interface SizeDef {
  key: SizeKey;
  widthIn: number;
  heightIn: number;
  /** Human-friendly label for UI. */
  label: string;     // e.g., "12×16 in"
  /** Aspect ratio as a reduced fraction (for display only). */
  aspectRatio: string; // e.g., "3:4", "1:1", "5:7"
}

/** Per-product print rules. */
export interface ProductSpec {
  productType: ProductType;
  /** Which finished sizes this product supports. */
  sizes: SizeKey[];
  /** Available frame colors (framed only). */
  frames?: FrameColor[];
  /**
   * Default Fit/Fill when aspect ratios mismatch.
   * Printful advises full-bleed, so we default to "fill".
   */
  defaultFitMode: FitMode;
  /** Color profile for print files. */
  colorProfile: "sRGB";
  /** DPI target for print files. */
  dpi: number;
  /**
   * Extra inches added on EACH EDGE of the print file compared to the finished size.
   * Posters/Framed: 0 (file size == product size).
   * Canvas: 1.5" per edge (so file W/H are +3" total), per your spec.
   */
  fileOversizeInEachEdge: number;
  /**
   * Safe area inset (inches) from EACH EDGE inside the PRINT FILE canvas where important content should remain.
   * Posters/Framed: 0.5" per edge (safe area is 1" smaller in W/H than the file).
   * Canvas: 1.5" per edge (safe area == front face, avoids wrap).
   */
  safeInsetInEachEdge: number;
}

/** ---------- Global Print Rules ---------- */
export const DEFAULT_DPI = 300; // Printful minimum is 300 DPI
export const COLOR_PROFILE = "sRGB" as const;

/** ---------- Allowed Sizes per Product ---------- */
export const POSTER_AND_FRAMED_SIZES: SizeKey[] = [
  "5x7","8x10","10x10","11x14","12x12","12x16","12x18",
  "14x14","16x16","16x20","18x18","18x24","20x30","24x36",
];

export const CANVAS_SIZES: SizeKey[] = [
  "6x6","8x8","8x10","8x12","9x12","10x10","10x20","11x14","12x12","12x16","12x18",
  "12x24","12x36","14x14","16x16","16x20","16x24","16x32","16x48","18x18","18x24",
  "18x26","20x20","20x24","20x28","20x30","20x40","20x60","24x24","24x30","24x32",
  "24x36","24x48","26x26","26x40","28x28","28x40","30x30","30x40","30x60","32x32",
  "32x48","36x36","37x37","40x55","40x60",
];

/** ---------- Size Catalog (finished sizes) ---------- */
export const ART_SIZE_DEFS: Record<SizeKey, SizeDef> = {
  // Posters/Framed + shared
  "5x7":   { key:"5x7",   widthIn:5,  heightIn:7,  label:"5×7 in",   aspectRatio:"5:7" },
  "8x10":  { key:"8x10",  widthIn:8,  heightIn:10, label:"8×10 in",  aspectRatio:"4:5" },
  "10x10": { key:"10x10", widthIn:10, heightIn:10, label:"10×10 in", aspectRatio:"1:1" },
  "11x14": { key:"11x14", widthIn:11, heightIn:14, label:"11×14 in", aspectRatio:"11:14" },
  "12x12": { key:"12x12", widthIn:12, heightIn:12, label:"12×12 in", aspectRatio:"1:1" },
  "12x16": { key:"12x16", widthIn:12, heightIn:16, label:"12×16 in", aspectRatio:"3:4" },
  "12x18": { key:"12x18", widthIn:12, heightIn:18, label:"12×18 in", aspectRatio:"2:3" },
  "14x14": { key:"14x14", widthIn:14, heightIn:14, label:"14×14 in", aspectRatio:"1:1" },
  "16x16": { key:"16x16", widthIn:16, heightIn:16, label:"16×16 in", aspectRatio:"1:1" },
  "16x20": { key:"16x20", widthIn:16, heightIn:20, label:"16×20 in", aspectRatio:"4:5" },
  "18x18": { key:"18x18", widthIn:18, heightIn:18, label:"18×18 in", aspectRatio:"1:1" },
  "18x24": { key:"18x24", widthIn:18, heightIn:24, label:"18×24 in", aspectRatio:"3:4" },
  "20x30": { key:"20x30", widthIn:20, heightIn:30, label:"20×30 in", aspectRatio:"2:3" },
  "24x36": { key:"24x36", widthIn:24, heightIn:36, label:"24×36 in", aspectRatio:"2:3" },

  // Canvas-only extras (+ overlaps already defined above are acceptable choices too)
  "6x6":   { key:"6x6",   widthIn:6,  heightIn:6,  label:"6×6 in",   aspectRatio:"1:1" },
  "8x8":   { key:"8x8",   widthIn:8,  heightIn:8,  label:"8×8 in",   aspectRatio:"1:1" },
  "8x12":  { key:"8x12",  widthIn:8,  heightIn:12, label:"8×12 in",  aspectRatio:"2:3" },
  "9x12":  { key:"9x12",  widthIn:9,  heightIn:12, label:"9×12 in",  aspectRatio:"3:4" },
  "10x20": { key:"10x20", widthIn:10, heightIn:20, label:"10×20 in", aspectRatio:"1:2" },
  "12x24": { key:"12x24", widthIn:12, heightIn:24, label:"12×24 in", aspectRatio:"1:2" },
  "12x36": { key:"12x36", widthIn:12, heightIn:36, label:"12×36 in", aspectRatio:"1:3" },
  "16x24": { key:"16x24", widthIn:16, heightIn:24, label:"16×24 in", aspectRatio:"2:3" },
  "16x32": { key:"16x32", widthIn:16, heightIn:32, label:"16×32 in", aspectRatio:"1:2" },
  "16x48": { key:"16x48", widthIn:16, heightIn:48, label:"16×48 in", aspectRatio:"1:3" },
  "18x26": { key:"18x26", widthIn:18, heightIn:26, label:"18×26 in", aspectRatio:"9:13" },
  "20x20": { key:"20x20", widthIn:20, heightIn:20, label:"20×20 in", aspectRatio:"1:1" },
  "20x24": { key:"20x24", widthIn:20, heightIn:24, label:"20×24 in", aspectRatio:"5:6" },
  "20x28": { key:"20x28", widthIn:20, heightIn:28, label:"20×28 in", aspectRatio:"5:7" },
  "20x40": { key:"20x40", widthIn:20, heightIn:40, label:"20×40 in", aspectRatio:"1:2" },
  "20x60": { key:"20x60", widthIn:20, heightIn:60, label:"20×60 in", aspectRatio:"1:3" },
  "24x24": { key:"24x24", widthIn:24, heightIn:24, label:"24×24 in", aspectRatio:"1:1" },
  "24x30": { key:"24x30", widthIn:24, heightIn:30, label:"24×30 in", aspectRatio:"4:5" },
  "24x32": { key:"24x32", widthIn:24, heightIn:32, label:"24×32 in", aspectRatio:"3:4" },
  "24x48": { key:"24x48", widthIn:24, heightIn:48, label:"24×48 in", aspectRatio:"1:2" },
  "26x26": { key:"26x26", widthIn:26, heightIn:26, label:"26×26 in", aspectRatio:"1:1" },
  "26x40": { key:"26x40", widthIn:26, heightIn:40, label:"26×40 in", aspectRatio:"13:20" },
  "28x28": { key:"28x28", widthIn:28, heightIn:28, label:"28×28 in", aspectRatio:"1:1" },
  "28x40": { key:"28x40", widthIn:28, heightIn:40, label:"28×40 in", aspectRatio:"7:10" },
  "30x30": { key:"30x30", widthIn:30, heightIn:30, label:"30×30 in", aspectRatio:"1:1" },
  "30x40": { key:"30x40", widthIn:30, heightIn:40, label:"30×40 in", aspectRatio:"3:4" },
  "30x60": { key:"30x60", widthIn:30, heightIn:60, label:"30×60 in", aspectRatio:"1:2" },
  "32x32": { key:"32x32", widthIn:32, heightIn:32, label:"32×32 in", aspectRatio:"1:1" },
  "32x48": { key:"32x48", widthIn:32, heightIn:48, label:"32×48 in", aspectRatio:"2:3" },
  "36x36": { key:"36x36", widthIn:36, heightIn:36, label:"36×36 in", aspectRatio:"1:1" },
  "37x37": { key:"37x37", widthIn:37, heightIn:37, label:"37×37 in", aspectRatio:"1:1" },
  "40x55": { key:"40x55", widthIn:40, heightIn:55, label:"40×55 in", aspectRatio:"8:11" },
  "40x60": { key:"40x60", widthIn:40, heightIn:60, label:"40×60 in", aspectRatio:"2:3" },
};

/** ---------- Product Specs (per product type) ---------- */
export const PRODUCT_SPECS: Record<ProductType, ProductSpec> = {
  poster: {
    productType: "poster",
    sizes: POSTER_AND_FRAMED_SIZES,
    defaultFitMode: "fill",           // full-bleed (avoid borders)
    colorProfile: COLOR_PROFILE,
    dpi: DEFAULT_DPI,
    fileOversizeInEachEdge: 0,        // file == finished size
    safeInsetInEachEdge: 0.5,         // safe area 0.5" each edge (file-safe box is -1" W/H)
  },
  framed: {
    productType: "framed",
    sizes: POSTER_AND_FRAMED_SIZES,   // same print file sizes as posters
    frames: ["black", "white", "natural"],
    defaultFitMode: "fill",           // full-bleed under frame
    colorProfile: COLOR_PROFILE,
    dpi: DEFAULT_DPI,
    fileOversizeInEachEdge: 0,        // file == finished size
    safeInsetInEachEdge: 0.5,         // 0.5" each edge safe area
  },
  canvas: {
    productType: "canvas",
    sizes: CANVAS_SIZES,
    defaultFitMode: "fill",           // edge-to-edge wrap looks best
    colorProfile: COLOR_PROFILE,
    dpi: DEFAULT_DPI,
    fileOversizeInEachEdge: 1.5,      // +1.5" each edge (file W/H +3")
    safeInsetInEachEdge: 1.5,         // keep key content on the front face
  },
};

/** ---------- Helpers ---------- */

/** Spec for a given product type. */
export function getProductSpec(productType: ProductType): ProductSpec {
  return PRODUCT_SPECS[productType];
}

/** Size definition by key (finished size). */
export function getSizeDef(size: SizeKey): SizeDef {
  return ART_SIZE_DEFS[size];
}

/**
 * Compute PRINT FILE inches (including per-product oversize, if any).
 * e.g., canvas 12×16 => file 15×19 (since +1.5" each edge).
 */
export function fileInches(productType: ProductType, size: SizeKey): { widthIn: number; heightIn: number } {
  const spec = getProductSpec(productType);
  const s = getSizeDef(size);
  const w = s.widthIn + spec.fileOversizeInEachEdge * 2;
  const h = s.heightIn + spec.fileOversizeInEachEdge * 2;
  return { widthIn: w, heightIn: h };
}

/** Inches → pixels at the given DPI (rounded). */
export function inchesToPixels(widthIn: number, heightIn: number, dpi = DEFAULT_DPI) {
  return { widthPx: Math.round(widthIn * dpi), heightPx: Math.round(heightIn * dpi) };
}

/**
 * Target PRINT FILE pixels for a product+size (includes oversize if applicable).
 * Use for the server print-file builder.
 */
export function getTargetPixels(productType: ProductType, size: SizeKey, dpi = DEFAULT_DPI) {
  const { widthIn, heightIn } = fileInches(productType, size);
  return inchesToPixels(widthIn, heightIn, dpi);
}

/**
 * Safe area inches inside the PRINT FILE canvas (for overlays / validation).
 * Posters/Framed: file minus 0.5" each edge → -1" W/H.
 * Canvas: file minus 1.5" each edge → equals the front face (finished size).
 */
export function safeAreaInches(productType: ProductType, size: SizeKey) {
  const spec = getProductSpec(productType);
  const file = fileInches(productType, size);
  const widthIn = Math.max(0, file.widthIn - spec.safeInsetInEachEdge * 2);
  const heightIn = Math.max(0, file.heightIn - spec.safeInsetInEachEdge * 2);
  return { widthIn, heightIn };
}

/** Convenience for UI: list sizes ready to render as options. */
export function listSizes(productType: ProductType): SizeDef[] {
  const spec = getProductSpec(productType);
  return spec.sizes.map((k) => ART_SIZE_DEFS[k]);
}

/** Frames available for a product (or empty array if N/A). */
export function listFrames(productType: ProductType): FrameColor[] {
  return PRODUCT_SPECS[productType].frames ?? [];
}

/** Is a specific size allowed for this product type? */
export function isSizeAllowed(productType: ProductType, size: SizeKey): boolean {
  return PRODUCT_SPECS[productType].sizes.includes(size);
}

/** Orientation helper. */
export function detectOrientation(imgW: number, imgH: number): Exclude<Orientation, "auto"> {
  return imgW >= imgH ? "landscape" : "portrait";
}

/** Aspect ratio (W/H) float for any finished size key. */
export function ratioFor(size: SizeKey): number {
  const s = ART_SIZE_DEFS[size];
  return s.widthIn / s.heightIn;
}

/** Ratios are considered “matching” if within this delta. */
export const RATIO_TOLERANCE = 0.02; // ~2%