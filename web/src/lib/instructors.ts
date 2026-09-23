import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/config";

export type PublicInstructor = {
  id: string;
  slug: string;
  display_name: string;
  topic: string | null;
  headline: string | null;
  bio: string | null;
  credentials: string | null;
  photo_url: string | null;
  courses: { slug: string; title: string; subtitle: string | null; price_cents: number; currency: string; status: string }[];
};

// Cliente anónimo SIN cookies: permite cachear las páginas públicas.
function anonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

export const getPublicInstructors = unstable_cache(
  async (): Promise<PublicInstructor[]> => {
    if (!supabaseConfigured) return [];
    const { data } = await anonClient()
      .from("instructors")
      .select(
        "id, slug, display_name, topic, headline, bio, credentials, photo_url, courses(slug, title, subtitle, price_cents, currency, status)",
      )
      .eq("active", true)
      .order("display_name");
    return (data ?? []).map((i) => ({
      ...i,
      courses: (i.courses ?? []).filter((c) => c.status === "published"),
    }));
  },
  ["public-instructors"],
  { revalidate: 60 },
);

export async function getPublicInstructor(slug: string): Promise<PublicInstructor | null> {
  const all = await getPublicInstructors();
  return all.find((i) => i.slug === slug) ?? null;
}
