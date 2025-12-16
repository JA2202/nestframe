// app/api/generated-art/[id]/print-file/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { put } from "@vercel/blob";
import { buildPrintReadyPng } from "@/lib/printFileBuilder";

export const runtime = "nodejs";

type PrintType = "FRAMED_PRINT" | "PRINT_ONLY" | "CANVAS";

function toProductType(printType: PrintType) {
  if (printType === "CANVAS") return "canvas";
  if (printType === "FRAMED_PRINT") return "framed";
  return "poster";
}

function getBlobToken() {
  // Use your project-specific env var name from Vercel Storage
  const token =
    process.env.NESTFRAME_READ_WRITE_TOKEN ||
    process.env.NEST_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "Missing Vercel Blob token env var (expected NESTFRAME_READ_WRITE_TOKEN or NEST_READ_WRITE_TOKEN)."
    );
  }
  return token;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      size?: string;
      printType?: PrintType;
      frameColour?: string | null;
    };

    const size = body?.size;
    const printType = body?.printType;

    if (!size || !printType) {
      return NextResponse.json(
        { error: "Missing size or printType" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("generated_art")
      .select("id, image_url, crop")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
    }

    const productType = toProductType(printType);

    const built = await buildPrintReadyPng({
      imageUrl: data.image_url as string,
      crop: (data as any).crop ?? null,
      productType: productType as any,
      size,
    });

    const filename = `print_${id}_${productType}_${built.sizeKey}_${built.widthPx}x${built.heightPx}.png`;

    const blob = await put(filename, built.png, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: true,
      token: getBlobToken(), // ✅ key change
    });

    return NextResponse.json(
      {
        ok: true,
        url: blob.url,
        filename,
        meta: {
          productType,
          size: built.sizeKey,
          widthPx: built.widthPx,
          heightPx: built.heightPx,
          dpi: 300,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build print file" },
      { status: 500 }
    );
  }
}