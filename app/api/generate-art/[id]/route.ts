// app/api/generated-art/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("generated_art")
      .select("id, image_url, crop, shape")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id as string,
      imageUrl: data.image_url as string,
      crop: (data as { crop: unknown }).crop ?? null,
      shape: (data as { shape: unknown }).shape ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load art" }, { status: 500 });
  }
}