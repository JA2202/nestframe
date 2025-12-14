export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const ONE_BY_ONE_PNG_BLOB = new Blob(
  [
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axn6bQAAAAASUVORK5CYII=",
      "base64"
    ),
  ],
  { type: "image/png" }
);

function placeholder() {
  return new Response(ONE_BY_ONE_PNG_BLOB, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "X-NF-Preview": "placeholder",
    },
  });
}

function parseDataUrl(dataUrl: string): { mime: string; blob: Blob } | null {
  if (!dataUrl.startsWith("data:")) return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;

  const mime = match[1] || "image/png";
  const b64 = match[2] || "";

  try {
    const bytes = Buffer.from(b64, "base64");
    return { mime, blob: new Blob([bytes], { type: mime }) };
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  // Next.js 16 (Turbopack) can provide params as a Promise
  const maybeParams: any = ctx.params;
  const resolvedParams =
    typeof maybeParams?.then === "function" ? await maybeParams : maybeParams;

  const id = resolvedParams?.id as string | undefined;
  if (!id) return placeholder();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return placeholder();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("generated_art")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return placeholder();
  }

  const imageRef: unknown =
    (data as any).imageUrl ??
    (data as any).image_url ??
    (data as any).image ??
    (data as any).url;

  if (typeof imageRef !== "string" || imageRef.length === 0) {
    return placeholder();
  }

  // If the DB stored a data URL, decode and return bytes
  const decoded = parseDataUrl(imageRef);
  if (decoded) {
    return new Response(decoded.blob, {
      status: 200,
      headers: {
        "Content-Type": decoded.mime,
        "Cache-Control": "public, max-age=3600",
        "X-NF-Preview": "data-url",
      },
    });
  }

  // If the DB stored a normal URL, proxy it back as an image
  if (imageRef.startsWith("http://") || imageRef.startsWith("https://")) {
    try {
      const upstream = await fetch(imageRef, { cache: "no-store" });
      if (!upstream.ok) return placeholder();

      const contentType = upstream.headers.get("content-type") || "image/png";
      const ab = await upstream.arrayBuffer();
      const blob = new Blob([ab], { type: contentType });

      return new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "X-NF-Preview": "proxied-url",
        },
      });
    } catch {
      return placeholder();
    }
  }

  return placeholder();
}