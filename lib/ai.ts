// lib/ai.ts
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({ apiKey });

type GenerateParams = {
  prompt: string;
  room?: string;
  stylePreset?: string;
  count?: number;
  shape?: "square" | "tall" | "wide";
};

function buildWallArtPrompt(params: GenerateParams): string {
  const { prompt, room, stylePreset } = params;

  const styleMap: Record<string, string> = {
    "scandi-minimal":
      "Scandinavian minimal illustration, clean vector shapes, neutral tones, soft contrast, lots of negative space",
    "warm-abstract":
      "warm abstract illustration, simple organic shapes, beiges, browns and muted terracotta",
    "line-art":
      "minimal black line art illustration on an off white background, simple and elegant, no shading",
    "bold-color":
      "bold colour blocking illustration, graphic shapes, strong contrast, gallery style",
    surreal:
      "dreamy surrealist illustration, imaginative composition, art-gallery quality",
  };

  const roomMap: Record<string, string> = {
    "living-room": "that would suit a modern living room palette",
    bedroom: "that would suit a calm bedroom palette",
    office: "that would suit a focused home office palette",
    hallway: "that would suit a bright hallway palette",
    nursery: "that would suit a soft, playful nursery palette",
    other: "that would suit a modern home interior palette",
  };

  const styleDescription =
    (stylePreset && styleMap[stylePreset]) ||
    "timeless, gallery-quality illustration";
  const roomDescription =
    (room && roomMap[room]) || "that would suit a modern home interior palette";

  return [
    "Create a digital illustration designed to be used as wall art.",
    styleDescription + ", " + roomDescription + ".",
    "The artwork must completely fill the canvas edge-to-edge.",
    "Do not show any picture frames, canvases, walls, paper, margins, borders, mats, shadows, mockups, or 3D scenes.",
    "There should be no white border or background around the artwork; the outermost pixels are the art itself.",
    "Use a straight-on, front-facing view.",
    "Do not include any text, captions, logos or watermarks.",
    `Subject: ${prompt}.`,
  ].join(" ");
}

export async function generateWallArtImages(
  params: GenerateParams
): Promise<{ url: string }[]> {
  const count = params.count ?? 4;
  const finalPrompt = buildWallArtPrompt(params);

  // Map wizard shape to OpenAI-supported sizes:
  // Supported: "1024x1024", "1024x1536" (tall), "1536x1024" (wide), "auto"
  let size: "auto" | "1024x1024" | "1024x1536" | "1536x1024" = "1024x1024";

  if (params.shape === "tall") {
    size = "1024x1536";
  } else if (params.shape === "wide") {
    size = "1536x1024";
  } else {
    size = "1024x1024";
  }

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: finalPrompt,
    size,
    n: count,
    // no response_format here; we support both URL and base64 below
  });

  const data: any[] = response.data ?? [];

  const results: { url: string }[] = [];

  for (const img of data) {
    if (!img) continue;

    let url: string | undefined = img.url;

    if (!url && img.b64_json) {
      url = `data:image/png;base64,${img.b64_json}`;
    }

    if (url) {
      results.push({ url });
    }
  }

  if (results.length === 0) {
    throw new Error("No usable image data returned from OpenAI");
  }

  return results;
}