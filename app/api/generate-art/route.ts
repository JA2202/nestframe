// app/api/generate-art/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { generateWallArtImages } from "@/lib/ai";

type GenerateBody = {
  prompt: string;
  room?: string;
  stylePreset?: string;
  mood?: string;
  anonymousId?: string;
  shape?: "square" | "tall" | "wide";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateBody;

    if (!body.prompt || body.prompt.trim().length < 5) {
      return NextResponse.json(
        { error: "Prompt is too short" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const userId = null; // later we can attach logged-in user

    // 1) Call OpenAI to generate multiple images (e.g. 4)
    const images = await generateWallArtImages({
      prompt: body.prompt,
      room: body.room,
      stylePreset: body.stylePreset,
      count: 4,
      shape: body.shape,
    });

    // 2) Save each image as a row in generated_art
    const rowsToInsert = images.map((img) => ({
      user_id: userId,
      anonymous_id: body.anonymousId ?? null,
      prompt: body.prompt,
      room: body.room ?? null,
      style_preset: body.stylePreset ?? null,
      mood: body.mood ?? null,
      image_url: img.url,
      status: "created",
    }));

    const { data, error } = await supabase
      .from("generated_art")
      .insert(rowsToInsert)
      .select("id, image_url");

    if (error || !data) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to save generated art" },
        { status: 500 }
      );
    }

    const results = data.map((row) => ({
      id: row.id as string,
      imageUrl: row.image_url as string,
    }));

    const first = results[0];

    return NextResponse.json(
      first
        ? {
            // top-level shape expected by the wizard
            id: first.id,
            imageUrl: first.imageUrl,
            // keep existing array for any callers that use it
            results,
          }
        : { results }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate art" },
      { status: 500 }
    );
  }
}