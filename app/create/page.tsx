"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GeneratedResult = {
  id: string;
  imageUrl: string;
};

type Step = 1 | 2 | 3 | 4;

const ROOM_OPTIONS = [
  { value: "living-room", label: "Living room", helper: "Centrepiece above a sofa or sideboard." },
  { value: "bedroom", label: "Bedroom", helper: "Calm, soft and relaxing to wake up to." },
  { value: "office", label: "Home office", helper: "Clean, focused art for your workspace." },
  { value: "hallway", label: "Hallway", helper: "Great first impression as you walk in." },
  { value: "nursery", label: "Nursery / kids room", helper: "Playful but not babyish." },
  { value: "other", label: "Somewhere else", helper: "We will keep it versatile so it works anywhere." },
];

const ORIENTATION_OPTIONS = [
  {
    value: "portrait" as const,
    label: "Tall (portrait)",
    helper: "Best for narrow spaces and above console tables.",
  },
  {
    value: "landscape" as const,
    label: "Wide (landscape)",
    helper: "Great over sofas, beds and dining tables.",
  },
  {
    value: "square" as const,
    label: "Square",
    helper: "Balanced look that works almost anywhere.",
  },
];

const STYLE_OPTIONS = [
  {
    value: "scandi-minimal",
    label: "Scandi minimal",
    helper: "Soft lines, calm and understated.",
  },
  {
    value: "warm-abstract",
    label: "Warm abstract",
    helper: "Organic shapes in warm, cosy tones.",
  },
  {
    value: "line-art",
    label: "Line art",
    helper: "Minimal line drawings with lots of breathing room.",
  },
  {
    value: "bold-color",
    label: "Bold colour",
    helper: "Stronger shapes and colour without feeling loud.",
  },
  {
    value: "surreal",
    label: "Surreal",
    helper: "A bit more imaginative and dream-like.",
  },
];

// Deep search helper: find first string value that looks like a URL
function findFirstUrl(value: unknown): string | null {
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();

    if (typeof current === "string") {
      if (current.startsWith("http://") || current.startsWith("https://")) {
        return current;
      }
    } else if (Array.isArray(current)) {
      for (const v of current) stack.push(v);
    } else if (current && typeof current === "object") {
      for (const v of Object.values(current as Record<string, unknown>)) {
        stack.push(v);
      }
    }
  }

  return null;
}

export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [room, setRoom] = useState<string>("living-room");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">("portrait");
  const [style, setStyle] = useState<string>("scandi-minimal");
  const [idea, setIdea] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);

  const stepLabels: Record<Step, string> = {
    1: "Room",
    2: "Layout",
    3: "Style",
    4: "Your idea",
  };

  // FIX: dynamic aspect ratio for preview + thumbnails (matches generator sizes)
  // tall = 1024x1536 => 2/3
  // wide = 1536x1024 => 3/2
  // square = 1/1
  const previewAspectClass =
    orientation === "portrait"
      ? "aspect-[2/3]"
      : orientation === "landscape"
      ? "aspect-[3/2]"
      : "aspect-square";

  const handleNext = () => {
    setErrorMsg(null);
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    } else {
      void handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setErrorMsg(null);
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleGenerate = async () => {
    setErrorMsg(null);
    setResult(null);
    setResults([]);

    if (!idea.trim()) {
      setErrorMsg("Please describe what you want to see, even if it is just a few words.");
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      const base = idea.trim();

      const orientationHint =
        orientation === "portrait"
          ? "vertical wall art, portrait poster composition"
          : orientation === "landscape"
          ? "horizontal wall art, landscape poster composition"
          : "square wall art composition";

      const roomHint = (() => {
        switch (room) {
          case "living-room":
            return "designed to feel calm and welcoming in a living room";
          case "bedroom":
            return "soft and restful artwork suited for a bedroom";
          case "office":
            return "clean, focused artwork for a home office";
          case "hallway":
            return "simple but eye catching artwork for a hallway";
          case "nursery":
            return "playful, family friendly artwork for a kids room";
          default:
            return "versatile modern wall art that works in most homes";
        }
      })();

      const finalPrompt = `${base}, ${orientationHint}, ${roomHint}`;

      // Map wizard orientation to shape expected by the API
      const shape: "square" | "tall" | "wide" =
        orientation === "portrait"
          ? "tall"
          : orientation === "landscape"
          ? "wide"
          : "square";

      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          room,
          stylePreset: style,
          mood: null,
          shape,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong while creating your art.");
      }

      const raw = await res.json().catch(() => null);

      if (!raw || typeof raw !== "object") {
        throw new Error("Server did not return JSON.");
      }

      // Prefer explicit results array from the API
      const apiResults = (raw as any).results as GeneratedResult[] | undefined;
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        setResults(apiResults);
        setResult(apiResults[0]);
        return;
      }

      // Fallback: Try common keys first on the top-level response
      let imageUrl: string =
        (raw as any).imageUrl ??
        (raw as any).image_url ??
        (raw as any).url ??
        (raw as any).originalUrl ??
        (raw as any).original_url ??
        (raw as any).src ??
        (raw as any).image?.url ??
        (raw as any).art?.imageUrl ??
        (raw as any).art?.originalUrl ??
        "";

      // Fallback: deep search for first URL string
      if (!imageUrl) {
        const found = findFirstUrl(raw);
        if (found) imageUrl = found;
      }

      if (!imageUrl) {
        throw new Error("The server did not return an image URL.");
      }

      const id: string =
        (raw as any).id ??
        (raw as any).generatedId ??
        (raw as any).artId ??
        (raw as any).art?.id ??
        "";

      const single = { id, imageUrl };
      setResult(single);
      setResults([single]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate art. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nf-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-heading text-nf-ink mb-3">
          Create custom wall art
        </h1>
        <p className="text-sm text-nf-text-muted mb-6 max-w-2xl">
          We will ask a few quick questions about your room and style, then nestframe will turn your idea into gallery worthy wall art.
        </p>

        <div className="mb-6 text-xs font-medium text-nf-text-muted">
          Step {step} of 4 · {stepLabels[step]}
        </div>

        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
          {/* Left: wizard */}
          <div className="space-y-6">
            <div className="bg-nf-surface rounded-xl border border-nf-border p-4 md:p-5 space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-nf-text">
                    Which room is this for?
                  </h2>
                  <p className="text-xs text-nf-text-muted">
                    This helps us keep the art feeling right for the space.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROOM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRoom(opt.value)}
                        className={`w-full text-left rounded-lg border px-3 py-3 text-sm transition ${
                          room === opt.value
                            ? "border-nf-primary bg-nf-primary-soft"
                            : "border-nf-border bg-white hover:bg-nf-grey100"
                        }`}
                      >
                        <div className="font-medium text-nf-text">{opt.label}</div>
                        <div className="mt-1 text-[11px] text-nf-text-muted">
                          {opt.helper}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-nf-text">
                    How should it sit on the wall?
                  </h2>
                  <p className="text-xs text-nf-text-muted">
                    You will choose exact size later. For now, pick the overall layout.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {ORIENTATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOrientation(opt.value)}
                        className={`w-full text-left rounded-lg border px-3 py-3 text-sm transition ${
                          orientation === opt.value
                            ? "border-nf-primary bg-nf-primary-soft"
                            : "border-nf-border bg-white hover:bg-nf-grey100"
                        }`}
                      >
                        <div className="font-medium text-nf-text">{opt.label}</div>
                        <div className="mt-1 text-[11px] text-nf-text-muted">
                          {opt.helper}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-nf-text-muted">
                    On the next screen you will be able to crop the art so it fits perfectly in the frame.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-nf-text">
                    What kind of art feels right?
                  </h2>
                  <p className="text-xs text-nf-text-muted">
                    Choose a style. You can always try a different one later.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStyle(opt.value)}
                        className={`w-full text-left rounded-lg border px-3 py-3 text-sm transition ${
                          style === opt.value
                            ? "border-nf-primary bg-nf-primary-soft"
                            : "border-nf-border bg-white hover:bg-nf-grey100"
                        }`}
                      >
                        <div className="font-medium text-nf-text">{opt.label}</div>
                        <div className="mt-1 text-[11px] text-nf-text-muted">
                          {opt.helper}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-nf-text">
                    Describe your idea in a few words
                  </h2>
                  <p className="text-xs text-nf-text-muted">
                    Plain language is perfect. For example: "simple parrot illustration in warm tones" or "soft abstract shapes inspired by fruit".
                  </p>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={4}
                    className="w-full border border-nf-border rounded-md px-3 py-2 text-sm bg-white"
                    placeholder="A simple parrot made from soft shapes in warm beige tones..."
                  />
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-nf-error">{errorMsg}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || loading}
                  className="text-xs text-nf-text-muted disabled:opacity-40"
                >
                  {step === 1 ? " " : "Back"}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-nf-primary text-white px-6 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {loading
                    ? "Creating your art..."
                    : step === 4
                    ? "Create my art"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: result preview */}
          <div className="bg-nf-surface rounded-xl border border-nf-border p-4 flex items-center justify-center min-h-[320px]">
            {!result && !loading && (
              <p className="text-sm text-nf-text-muted text-center max-w-xs">
                Your art will appear here once it is created. We will keep it frame-ready and free from AI-looking clutter.
              </p>
            )}

            {loading && (
              <p className="text-sm text-nf-text-muted text-center">
                Creating your artwork... this usually takes around 20 to 30 seconds.
              </p>
            )}

            {result && !loading && (
              <div className="w-full">
                <div
                  className={`${previewAspectClass} bg-nf-grey100 rounded-xl overflow-hidden flex items-center justify-center mb-3`}
                >
                  <img
                    src={result.imageUrl}
                    alt="Generated wall art"
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-xs text-nf-text-muted">
                  This piece is now saved in your nestframe studio. Soon you will be able to crop it, choose frame and size, and add it straight to your cart.
                </p>

                {results.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-nf-text-muted mb-2">
                      Tap a version to continue to the editor.
                    </p>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                      {results.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => router.push(`/edit/${r.id}`)}
                          className="group overflow-hidden rounded-lg border border-nf-border bg-white hover:shadow-sm transition"
                        >
                          <div className={`${previewAspectClass} bg-nf-grey100`}>
                            <img
                              src={r.imageUrl}
                              alt="Generated wall art option"
                              className="w-full h-full object-contain transition group-hover:scale-[1.01]"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}