// app/api/generated-art/[id]/crop/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

type CropBody = {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number };
  aspect: number;
  shape?: "square" | "tall" | "wide" | null;
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

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("generated_art")
      .update({
        crop: {
          crop: body.crop,
          zoom: body.zoom,
          croppedAreaPixels: body.croppedAreaPixels,
          aspect: body.aspect,
        },
        shape: body.shape ?? null,
      })
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