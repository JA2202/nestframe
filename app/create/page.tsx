"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Square,
} from "lucide-react";

type GeneratedResult = {
  id: string;
  imageUrl: string;
};

type Step = 1 | 2 | 3 | 4;

type Option = {
  value: string;
  label: string;
  helper: string;
  gradient: string;
  imageUrl?: string;
};

type Screen = "wizard" | "results";
type Step3Stage = "mood" | "style";

const PLACEHOLDER_CARD_IMAGE =
  "https://images.unsplash.com/photo-1631679706909-1844bbd07221?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2NTkxMDA4TEw&ixlib=rb-4.1.0&q=80&w=1080";

const ROOM_OPTIONS: Option[] = [
  {
    value: "living-room",
    label: "Living room",
    helper: "Centrepiece above a sofa or sideboard.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/living_room.webp?v=1766068041",
    gradient:
      "linear-gradient(135deg, rgba(185,121,75,0.18) 0%, rgba(247,243,237,1) 60%, rgba(255,255,255,1) 100%)",
  },
  {
    value: "bedroom",
    label: "Bedroom",
    helper: "Calm, soft and relaxing to wake up to.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/Bedroom.webp?v=1766068041",
    gradient:
      "linear-gradient(135deg, rgba(30,73,65,0.14) 0%, rgba(247,243,237,1) 62%, rgba(255,255,255,1) 100%)",
  },
  {
    value: "office",
    label: "Home office",
    helper: "Clean, focused art for your workspace.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/Home_Office.webp?v=1766068041",
    gradient:
      "linear-gradient(135deg, rgba(226,215,200,1) 0%, rgba(247,243,237,1) 70%, rgba(255,255,255,1) 100%)",
  },
  {
    value: "hallway",
    label: "Hallway",
    helper: "Great first impression as you walk in.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/Hallway.webp?v=1766068041",
    gradient:
      "linear-gradient(135deg, rgba(185,121,75,0.10) 0%, rgba(226,215,200,0.65) 55%, rgba(247,243,237,1) 100%)",
  },
  {
    value: "nursery",
    label: "Nursery / kids room",
    helper: "Playful but not babyish.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/Nursery.webp?v=1766068041",
    gradient:
      "linear-gradient(135deg, rgba(197,139,58,0.14) 0%, rgba(247,243,237,1) 62%, rgba(255,255,255,1) 100%)",
  },
  {
    value: "other",
    label: "Somewhere else",
    helper: "We will keep it versatile so it works anywhere.",
    imageUrl:
      "https://cdn.shopify.com/s/files/1/0928/8099/4685/files/Somewhere_else.webp?v=1766068040",
    gradient:
      "linear-gradient(135deg, rgba(111,106,99,0.12) 0%, rgba(247,243,237,1) 70%, rgba(255,255,255,1) 100%)",
  },
];

const ORIENTATION_OPTIONS = [
  {
    value: "portrait" as const,
    label: "Portrait",
    helper: "Best for narrow spaces and above console tables.",
    icon: <RectangleVertical className="h-8 w-8" strokeWidth={1.75} />,
  },
  {
    value: "landscape" as const,
    label: "Landscape",
    helper: "Great over sofas, beds and dining tables.",
    icon: <RectangleHorizontal className="h-8 w-8" strokeWidth={1.75} />,
  },
  {
    value: "square" as const,
    label: "Square",
    helper: "Balanced look that works almost anywhere.",
    icon: <Square className="h-8 w-8" strokeWidth={1.75} />,
  },
] as const;

const STYLE_OPTIONS: Option[] = [
  {
    value: "scandi-minimal",
    label: "Scandi minimal",
    helper: "Soft neutrals, calm textures, modern simplicity.",
    gradient:
      "linear-gradient(135deg, rgba(244,244,244,1) 0%, rgba(247,243,237,1) 65%, rgba(226,215,200,0.7) 100%)",
  },
  {
    value: "warm-abstract",
    label: "Warm abstract",
    helper: "Earthy shapes, warm tones, quiet luxury energy.",
    gradient:
      "linear-gradient(135deg, rgba(243,226,212,1) 0%, rgba(247,243,237,1) 65%, rgba(226,215,200,0.7) 100%)",
  },
  {
    value: "line-art",
    label: "Line art",
    helper: "Minimal line drawings with lots of breathing room.",
    gradient:
      "linear-gradient(135deg, rgba(226,215,200,0.9) 0%, rgba(247,243,237,1) 65%, rgba(244,244,244,1) 100%)",
  },
  {
    value: "bold-color",
    label: "Bold colour",
    helper: "Stronger shapes and colour without feeling loud.",
    gradient:
      "linear-gradient(135deg, rgba(185,121,75,0.18) 0%, rgba(247,243,237,1) 65%, rgba(244,244,244,1) 100%)",
  },
  {
    value: "surreal",
    label: "Surreal",
    helper: "A bit more imaginative and dream-like.",
    gradient:
      "linear-gradient(135deg, rgba(30,73,65,0.16) 0%, rgba(247,243,237,1) 65%, rgba(244,244,244,1) 100%)",
  },
];

const MOOD_OPTIONS: Option[] = [
  {
    value: "minimal-calm",
    label: "Minimal & Calm",
    helper: "Clean lines, soft tones, peaceful vibes.",
    gradient:
      "linear-gradient(135deg, rgba(30,73,65,0.18) 0%, rgba(247,243,237,1) 65%, rgba(226,215,200,0.65) 100%)",
  },
  {
    value: "warm-cozy",
    label: "Warm & Cozy",
    helper: "Earthy colours, organic shapes, inviting feel.",
    gradient:
      "linear-gradient(135deg, rgba(185,121,75,0.22) 0%, rgba(247,243,237,1) 65%, rgba(244,244,244,1) 100%)",
  },
];

const STYLES_BY_MOOD: Record<string, string[]> = {
  "minimal-calm": ["scandi-minimal", "line-art"],
  "warm-cozy": ["warm-abstract", "bold-color", "surreal"],
};

function WizardProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[320px] max-w-full flex items-center gap-3">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={[
              "h-[3px] flex-1 rounded-full transition-all",
              i < currentStep ? "bg-nf-text" : "bg-[rgba(34,34,34,0.25)]",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="text-xs text-nf-text-muted">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}

function CardOption({
  selected,
  onClick,
  label,
  helper,
  gradient, // kept for later swapping, currently unused for placeholder mode
  imageUrl,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  helper: string;
  gradient: string;
  imageUrl?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "relative overflow-hidden rounded-2xl border text-left transition",
        "shadow-[0_1px_0_rgba(34,34,34,0.02)]",
        "aspect-[4/3]",
        selected
          ? "border-nf-primary ring-2 ring-nf-primary/15"
          : "border-nf-border hover:border-nf-grey-300",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${imageUrl ?? PLACEHOLDER_CARD_IMAGE})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {selected ? (
        <span className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-nf-text text-white shadow-sm">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      ) : null}

      <div className="relative h-full w-full p-4 flex flex-col justify-end">
        <div>
          <h3 className="font-semibold text-white">{label}</h3>
          <p className="mt-1 text-xs text-white/80">{helper}</p>
        </div>
      </div>
    </button>
  );
}

function OrientationOption({
  selected,
  onClick,
  label,
  helper,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "relative rounded-xl border-2 p-6 transition text-center",
        selected
          ? "border-nf-primary bg-nf-primary-soft"
          : "border-nf-border bg-white hover:border-nf-grey-300",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-nf-text text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : null}

      <div
        className={[
          "mx-auto mb-3 w-fit",
          selected ? "text-nf-primary" : "text-nf-grey-700",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className={["font-semibold", selected ? "text-nf-text" : "text-nf-ink"].join(" ")}>
        {label}
      </div>
      <div className="mt-1 text-xs text-nf-text-muted">{helper}</div>
    </button>
  );
}

function findFirstUrl(value: unknown): string | null {
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();

    if (typeof current === "string") {
      if (current.startsWith("http://") || current.startsWith("https://")) return current;
    } else if (Array.isArray(current)) {
      for (const v of current) stack.push(v);
    } else if (current && typeof current === "object") {
      for (const v of Object.values(current as Record<string, unknown>)) stack.push(v);
    }
  }
  return null;
}

function StickyFooter({
  label,
  onClick,
  disabled,
  loading,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = (variant ?? "primary") === "primary";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="border-t border-nf-border bg-nf-bg/70 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={[
              "w-full rounded-full py-4 text-sm font-semibold transition",
              "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
              isPrimary
                ? "bg-nf-primary text-white hover:opacity-95"
                : "bg-nf-text text-white hover:opacity-95",
              "disabled:opacity-55 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? "Working..." : label}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();

  const [embedMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("embed") === "1";
  });

  const parentOriginRef = useRef<string>("*");
  const handleNextRef = useRef<() => void>(() => {});
  const handleBackRef = useRef<() => void>(() => {});

  const [screen, setScreen] = useState<Screen>("wizard");
  const [step3Stage, setStep3Stage] = useState<Step3Stage>("mood");

  const [step, setStep] = useState<Step>(1);
  const [room, setRoom] = useState<string>("living-room");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "square">("portrait");
  const [mood, setMood] = useState<string>("minimal-calm");
  const [style, setStyle] = useState<string>("scandi-minimal");
  const [idea, setIdea] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const previewAspectClass =
    orientation === "portrait"
      ? "aspect-[2/3]"
      : orientation === "landscape"
      ? "aspect-[3/2]"
      : "aspect-square";

  const filteredStyleOptions = useMemo(() => {
    const allowed = new Set(STYLES_BY_MOOD[mood] ?? []);
    const list = STYLE_OPTIONS.filter((s) => allowed.has(s.value));
    // safety: if mood mapping is empty, fall back to all styles
    return list.length ? list : STYLE_OPTIONS;
  }, [mood]);

  // Keep selected style valid for mood
  useMemo(() => {
    const allowed = new Set((STYLES_BY_MOOD[mood] ?? []) as string[]);
    if (allowed.size === 0) return;
    if (!allowed.has(style)) {
      const first = filteredStyleOptions[0]?.value;
      if (first) setStyle(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  const handleNext = () => {
    setErrorMsg(null);

    if (screen === "results") {
      if (!selectedId) return;
      router.push(`/edit/${selectedId}`);
      return;
    }

    // Step 3a -> Step 3b
    if (step === 3 && step3Stage === "mood") {
      setStep3Stage("style");
      return;
    }

    if (step < 4) setStep((s) => (s + 1) as Step);
    else void handleGenerate();
  };

  const handleBack = () => {
    setErrorMsg(null);

    if (screen === "results") {
      // "Create something new"
      setScreen("wizard");
      setStep(1);
      setStep3Stage("mood");
      setResults([]);
      setResult(null);
      setSelectedId(null);
      setIdea("");
      return;
    }

    // Step 3b -> Step 3a
    if (step === 3 && step3Stage === "style") {
      setStep3Stage("mood");
      return;
    }

    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  handleNextRef.current = handleNext;
  handleBackRef.current = handleBack;

  useEffect(() => {
    if (!embedMode) return;

    try {
      parentOriginRef.current = document.referrer ? new URL(document.referrer).origin : "*";
    } catch {
      parentOriginRef.current = "*";
    }

    const onMessage = (event: MessageEvent) => {
      if (parentOriginRef.current !== "*" && event.origin !== parentOriginRef.current) return;

      const data = event.data as any;
      if (!data || typeof data !== "object") return;

      if (data.type === "NF_CTA_NEXT") {
        handleNextRef.current();
      }

      if (data.type === "NF_CTA_BACK") {
        handleBackRef.current();
      }
    };

    window.addEventListener("message", onMessage);

    window.parent?.postMessage({ type: "NF_EMBED_READY" }, parentOriginRef.current);

    return () => window.removeEventListener("message", onMessage);
  }, [embedMode]);

  const handleGenerate = async () => {
    setErrorMsg(null);
    setResult(null);
    setResults([]);
    setSelectedId(null);

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
          ? "a tall portrait composition"
          : orientation === "landscape"
          ? "a wide landscape composition"
          : "a balanced square composition";

      const styleHint = (() => {
        switch (style) {
          case "scandi-minimal":
            return "minimal scandi style, soft neutrals, subtle texture, calm, modern";
          case "warm-abstract":
            return "warm abstract shapes, earthy palette, gentle paper texture, timeless";
          case "line-art":
            return "minimal line art, clean negative space, elegant and simple";
          case "bold-color":
            return "bold colour blocks, confident shapes, still premium and calm";
          case "surreal":
            return "surreal but tasteful, dreamlike details, gallery worthy";
          default:
            return "calm, premium, modern";
        }
      })();

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

      const finalPrompt = `${base}. ${orientationHint}. ${styleHint}. ${roomHint}.`;

      const shape =
        orientation === "portrait" ? "tall" : orientation === "landscape" ? "wide" : "square";

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
      if (!raw || typeof raw !== "object") throw new Error("Server did not return JSON.");

      const apiResults = (raw as any).results as GeneratedResult[] | undefined;
      if (Array.isArray(apiResults) && apiResults.length > 0) {
        setResults(apiResults);
        setResult(apiResults[0]);
        setSelectedId(apiResults[0]?.id ?? null);
        setScreen("results");
        return;
      }

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

      if (!imageUrl) {
        const found = findFirstUrl(raw);
        if (found) imageUrl = found;
      }

      if (!imageUrl) throw new Error("The server did not return an image URL.");

      const id: string =
        (raw as any).id ??
        (raw as any).art_id ??
        (raw as any).artId ??
        (raw as any).art?.id ??
        "";

      const single = { id, imageUrl };
      setResult(single);
      setResults([single]);
      setSelectedId(id || null);
      setScreen("results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate art. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const onSelectResult = (r: GeneratedResult) => {
    setResult(r);
    setSelectedId(r.id);
  };

  const canProceed = !!selectedId && !loading;

  const primaryCtaLabel = screen === "results" ? "Proceed" : step === 4 ? "Create my art" : "Next";

  useEffect(() => {
    if (!embedMode) return;

    const label =
      screen === "results" ? "Proceed" : step === 4 ? "Create my art" : "Next";

    const disabled = !!loading || (screen === "results" ? !canProceed : false);

    window.parent?.postMessage(
      {
        type: "NF_STATE",
        label,
        disabled,
        screen,
        step,
        step3Stage,
      },
      parentOriginRef.current
    );
  }, [embedMode, screen, step, step3Stage, loading, canProceed]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 pb-32">
      {/* Top row with back button left, centred stepper/title below */}
      <div className="h-8 mb-2">
        {screen === "results" || step > 1 || (step === 3 && step3Stage === "style") ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className={[
              "inline-flex items-center gap-2 text-sm font-medium",
              "text-nf-text hover:underline disabled:opacity-40",
            ].join(" ")}
          >
            <ArrowLeft className="h-4 w-4" />
            {screen === "results" ? "Create something new" : "Back"}
          </button>
        ) : null}
      </div>

      {screen === "wizard" ? (
        <div className="mb-10 text-center">
          <WizardProgress currentStep={step} totalSteps={4} />

          <h1 className="mt-6 text-3xl md:text-4xl font-heading text-nf-ink">
            Create custom wall art
          </h1>
          <p className="mt-2 text-sm text-nf-text-muted max-w-2xl mx-auto">
            We'll ask a few quick questions about your room and style, then nestframe will turn your idea into
            gallery worthy wall art.
          </p>
        </div>
      ) : null}

      {/* Wizard screens */}
      {screen === "wizard" ? (
        <div className="max-w-5xl mx-auto">
          <div className="p-0 md:p-0 border-0 bg-transparent shadow-none rounded-none">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading text-nf-ink">Which room is this for?</h2>
                  <p className="mt-2 text-sm text-nf-text-muted">
                    This helps us keep the art feeling right for the space.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {ROOM_OPTIONS.map((opt) => (
                    <CardOption
                      key={opt.value}
                      selected={room === opt.value}
                      onClick={() => setRoom(opt.value)}
                      label={opt.label}
                      helper={opt.helper}
                      gradient={opt.gradient}
                      imageUrl={opt.imageUrl}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading text-nf-ink">How should it sit on the wall?</h2>
                  <p className="mt-2 text-sm text-nf-text-muted">
                    Choose the orientation that works best for your space.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  {ORIENTATION_OPTIONS.map((opt) => (
                    <OrientationOption
                      key={opt.value}
                      selected={orientation === opt.value}
                      onClick={() => setOrientation(opt.value)}
                      label={opt.label}
                      helper={opt.helper}
                      icon={opt.icon}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {step3Stage === "mood" ? (
                  <>
                    <div>
                      <h2 className="text-2xl font-heading text-nf-ink">What kind of art feels right?</h2>
                      <p className="mt-2 text-sm text-nf-text-muted">
                        First, choose a mood that resonates with you.
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {MOOD_OPTIONS.map((opt) => (
                        <CardOption
                          key={opt.value}
                          selected={mood === opt.value}
                          onClick={() => setMood(opt.value)}
                          label={opt.label}
                          helper={opt.helper}
                          gradient={opt.gradient}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep3Stage("mood")}
                      className="inline-flex items-center gap-2 text-sm text-nf-text hover:underline"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to moods
                    </button>

                    <div>
                      <h2 className="text-2xl font-heading text-nf-ink">Choose your style</h2>
                      <p className="mt-2 text-sm text-nf-text-muted">
                        Select the specific art style you'd like.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                      {filteredStyleOptions.map((opt) => (
                        <CardOption
                          key={opt.value}
                          selected={style === opt.value}
                          onClick={() => setStyle(opt.value)}
                          label={opt.label}
                          helper={opt.helper}
                          gradient={opt.gradient}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-heading text-nf-ink">Describe your idea in a few words</h2>
                  <p className="mt-2 text-sm text-nf-text-muted">
                    Tell us what you're imagining. The more specific, the better we can bring it to life.
                  </p>
                </div>

                <div className="rounded-xl border border-nf-border bg-white p-3">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    rows={7}
                    className="w-full resize-none bg-transparent text-sm text-nf-text outline-none placeholder:text-nf-text-muted/70"
                    placeholder="e.g., A serene mountain landscape at sunset with warm oranges and pinks..."
                  />
                </div>

                {errorMsg ? (
                  <div className="rounded-xl border border-nf-error/30 bg-[rgba(180,73,61,0.06)] px-3 py-2 text-sm text-nf-error">
                    {errorMsg}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Results screen */}
      {screen === "results" ? (
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-heading text-nf-ink">Your Generated Art</h2>
            <p className="mt-2 text-sm text-nf-text-muted">
              Here are {results.length || 4} unique variations for you to choose from. Select your favourite.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {results.map((r, i) => {
              const selected = selectedId === r.id;
              return (
                <button
                  key={r.id || `${i}`}
                  type="button"
                  onClick={() => onSelectResult(r)}
                  aria-pressed={selected}
                  className={[
                    "relative overflow-hidden rounded-2xl border bg-white transition",
                    selected
                      ? "border-nf-primary ring-2 ring-nf-primary/15"
                      : "border-nf-border hover:border-nf-grey-300",
                  ].join(" ")}
                >
                  <div className={["w-full", previewAspectClass, "bg-nf-grey-100"].join(" ")}>
                    <img src={r.imageUrl} alt={`Variation ${i + 1}`} className="w-full h-full object-cover" />
                  </div>

                  {selected ? (
                    <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-nf-text text-white shadow-sm">
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </span>
                  ) : null}

                  <div className="py-3 text-sm text-nf-text-muted text-center">Variation {i + 1}</div>
                </button>
              );
            })}
          </div>

          {errorMsg ? <div className="mt-6 text-sm text-nf-error text-center">{errorMsg}</div> : null}
        </div>
      ) : null}

      {!embedMode ? (
        <StickyFooter
          label={screen === "wizard" && step === 4 ? `Create my art` : primaryCtaLabel}
          onClick={handleNext}
          loading={loading}
          disabled={screen === "results" ? !canProceed : false}
          variant={screen === "results" ? "secondary" : "primary"}
        />
      ) : null}

      {/* Keep the little sparkle icon on the step 4 CTA like your original, but in sticky footer */}
      {!embedMode && screen === "wizard" && step === 4 ? (
        <div className="sr-only">
          <Sparkles />
        </div>
      ) : null}
    </div>
  );
}