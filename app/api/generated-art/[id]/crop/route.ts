// app/api/generated-art/[id]/crop/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

type CropBody = {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number };
  aspect: number;
  shape?: "square" | "tall" | "wide" | null;

  // Optional product config (only persisted if provided)
  size?: string | null;
  frameColour?: "oak" | "walnut" | "black" | "white" | null;
  printType?: "PRINT_ONLY" | "FRAMED_PRINT" | null;
  priceCents?: number | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as CropBody;

    if (!body || !body.croppedAreaPixels || !body.aspect) {
      return NextResponse.json({ error: "Invalid crop payload" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      crop: {
        crop: body.crop,
        zoom: body.zoom,
        croppedAreaPixels: body.croppedAreaPixels,
        aspect: body.aspect,
      },
      shape: body.shape ?? null,
    };

    // Only update config fields if they were actually sent in the request body
    if (Object.prototype.hasOwnProperty.call(body, "size")) {
      updatePayload.size = body.size ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "frameColour")) {
      updatePayload.frame_colour = body.frameColour ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "printType")) {
      updatePayload.print_type = body.printType ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "priceCents")) {
      updatePayload.price_cents = body.priceCents ?? null;
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("generated_art")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to save crop" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save crop" }, { status: 500 });
  }
}