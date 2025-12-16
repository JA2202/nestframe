// lib/printFileBuilder.ts
import "server-only";
import sharp from "sharp";
import {
  ART_SIZE_DEFS,
  DEFAULT_DPI,
  getTargetPixels,
  isSizeAllowed,
  type SizeKey,
  type ProductType,
} from "@/lib/productSpecs";

type StoredCrop =
  | {
      croppedAreaPixels?: { x: number; y: number; width: number; height: number };
    }
  | {
      crop?: unknown;
      zoom?: unknown;
      aspect?: unknown;
      croppedAreaPixels?: { x: number; y: number; width: number; height: number };
    }
  | null
  | undefined;

function isDataUrl(url: string) {
  return /^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(url);
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (isDataUrl(url)) {
    const base64 = url.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function sanitiseSizeKey(raw: string): string {
  // Handles values like: 18x24, 18"x24", 18" x 24"
  return raw.replace(/\s+/g, "").replace(/"/g, "").toLowerCase();
}

function toSizeKey(raw: string): SizeKey {
  const key = sanitiseSizeKey(raw) as SizeKey;
  if (!(key in ART_SIZE_DEFS)) {
    throw new Error(`Unsupported size key: ${raw}`);
  }
  return key;
}

function clampExtract(
  cap: { x: number; y: number; width: number; height: number },
  imgW: number,
  imgH: number
) {
  const left = Math.max(0, Math.floor(cap.x));
  const top = Math.max(0, Math.floor(cap.y));
  const width = Math.max(1, Math.floor(cap.width));
  const height = Math.max(1, Math.floor(cap.height));

  const safeLeft = Math.min(left, Math.max(0, imgW - 1));
  const safeTop = Math.min(top, Math.max(0, imgH - 1));

  const safeWidth = Math.min(width, imgW - safeLeft);
  const safeHeight = Math.min(height, imgH - safeTop);

  return { left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight };
}

export async function buildPrintReadyPng(opts: {
  imageUrl: string;
  crop: StoredCrop;
  productType: ProductType; // "poster" | "framed" | "canvas"
  size: string; // e.g. "18x24"
}): Promise<{ png: Buffer; sizeKey: SizeKey; widthPx: number; heightPx: number }> {
  const sizeKey = toSizeKey(opts.size);

  if (!isSizeAllowed(opts.productType, sizeKey)) {
    throw new Error(`Size ${sizeKey} not allowed for product type ${opts.productType}`);
  }

  const { widthPx, heightPx } = getTargetPixels(opts.productType, sizeKey, DEFAULT_DPI);

  const input = await fetchImageBuffer(opts.imageUrl);
  const base = sharp(input, { failOn: "none" });

  const meta = await base.metadata();
  const imgW = meta.width ?? 0;
  const imgH = meta.height ?? 0;
  if (!imgW || !imgH) throw new Error("Could not read image dimensions");

  const cap =
    (opts.crop as any)?.croppedAreaPixels ??
    (opts.crop as any)?.crop?.croppedAreaPixels ??
    null;

  let pipeline = base;

  if (
    cap &&
    typeof cap.x === "number" &&
    typeof cap.y === "number" &&
    typeof cap.width === "number" &&
    typeof cap.height === "number"
  ) {
    const ex = clampExtract(cap, imgW, imgH);
    pipeline = pipeline.extract(ex);
  }

  const out = await pipeline
    .resize(widthPx, heightPx, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .withMetadata({ density: DEFAULT_DPI })
    .toBuffer();

  return { png: out, sizeKey, widthPx, heightPx };
}