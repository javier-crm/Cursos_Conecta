import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/config";
import { BuyBundleButton } from "./BuyBundleButton";

export const metadata = {
  title: "Paquetes",
  description: "Combina cursos en vivo y ahorra.",
};

type Bundle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  bundle_courses: { course: { slug: string; title: string; price_cents: number; status: string } | { slug: string; title: string; price_cents: number; status: string }[] | null }[];
};

const getBundles = unstable_cache(
  async (): Promise<Bundle[]> => {
    if (!supabaseConfigured) return [];
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data } = await anon
      .from("bundles")
      .select("id, slug, title, description, price_cents, currency, bundle_courses(course:courses(slug, title, price_cents, status))")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return (data as Bundle[]) ?? [];
  },
  ["public-bundles"],
  { revalidate: 60 },
);

const money = (cents: number) => `$${(cents / 100).toLocaleString("es-MX")}`;

export default async function Page() {
  const bundles = await getBundles();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Paquetes</h1>
      <p className="mt-1 text-slate-600">Llévate varios cursos juntos y ahorra.</p>

      {!bundles.length ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          Por ahora no hay paquetes activos. <Link href="/cursos" className="font-medium text-indigo-600 hover:underline">Ver cursos individuales</Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {bundles.map((bundle) => {
            const courses = bundle.bundle_courses
              .map((bc) => (Array.isArray(bc.course) ? bc.course[0] : bc.course))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));
            const regular = courses.reduce((sum, c) => sum + c.price_cents, 0);
            const savings = regular - bundle.price_cents;
            return (
              <div key={bundle.id} className="flex flex-col rounded-2xl border-2 border-indigo-200 bg-white p-6">
                <span className="w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Paquete
                </span>
                <h2 className="mt-3 text-xl font-bold text-slate-900">{bundle.title}</h2>
                {bundle.description && <p className="mt-1 text-sm text-slate-600">{bundle.description}</p>}
                <ul className="mt-4 space-y-2 text-sm">
                  {courses.map((course) => (
                    <li key={course.slug} className="flex justify-between gap-3">
                      <Link href={`/cursos/${course.slug}`} className="text-slate-700 hover:text-indigo-700 hover:underline">
                        ✓ {course.title}
                      </Link>
                      <span className="text-slate-400">{money(course.price_cents)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex-1" />
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {money(bundle.price_cents)} <span className="text-sm font-normal text-slate-500">{bundle.currency}</span>
                    </p>
                    {savings > 0 && (
                      <p className="text-sm font-semibold text-emerald-600">
                        Ahorras {money(savings)} <span className="font-normal text-slate-400 line-through">{money(regular)}</span>
                      </p>
                    )}
                  </div>
                  <BuyBundleButton slug={bundle.slug} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
