// app/edit/[id]/page.tsx
import { supabaseAdmin } from "@/lib/supabaseClient";
import GeneratedArtEditor from "@/components/editor/GeneratedArtEditor";
import ProductPanel from "@/components/edit/ProductPanel";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("generated_art")
    .select("id, image_url, crop, shape")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-nf-bg">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-heading text-nf-ink">Not found</h1>
          <p className="text-sm text-nf-text-muted mt-2">
            We couldn’t find that artwork.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GeneratedArtEditor
      id={data.id as string}
      imageUrl={data.image_url as string}
      initialCrop={(data as { crop: unknown }).crop ?? null}
      initialShape={(data as { shape: unknown }).shape ?? null}
    />
  );
}
