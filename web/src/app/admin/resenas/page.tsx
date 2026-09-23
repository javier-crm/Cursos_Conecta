import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Stars } from "@/components/Stars";

export const metadata = { title: "Reseñas" };

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Monterrey" });

async function moderate(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/resenas");
  const admin = createAdminClient();
  await admin
    .from("reviews")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/resenas");
  revalidatePath("/");
  revalidatePath("/cursos");
}

export default async function Page() {
  await requireRole(["admin"], "/admin/resenas");
  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, rating, comment, author_name, status, created_at, course:courses(title)")
    .order("created_at", { ascending: false })
    .limit(100);

  const pending = (reviews ?? []).filter((r) => r.status === "pending");
  const rest = (reviews ?? []).filter((r) => r.status !== "pending");

  const Card = ({ review }: { review: NonNullable<typeof reviews>[number] }) => {
    const course = Array.isArray(review.course) ? review.course[0] : review.course;
    return (
      <li className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Stars rating={review.rating} />
            <p className="mt-1 text-sm font-medium text-slate-900">
              {review.author_name} <span className="font-normal text-slate-500">· {course?.title}</span>
            </p>
          </div>
          <span className="text-xs text-slate-400">{dateFmt.format(new Date(review.created_at))}</span>
        </div>
        {review.comment && <p className="mt-2 text-sm text-slate-600">“{review.comment}”</p>}
        <div className="mt-3 flex items-center gap-2">
          {review.status !== "approved" && (
            <form action={moderate}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="status" value="approved" />
              <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Aprobar</button>
            </form>
          )}
          {review.status !== "rejected" && (
            <form action={moderate}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="status" value="rejected" />
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Rechazar</button>
            </form>
          )}
          {review.status !== "pending" && (
            <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${review.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {review.status === "approved" ? "Publicada" : "Rechazada"}
            </span>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Reseñas</h1>

      <h2 className="mt-6 text-lg font-semibold text-slate-900">Pendientes de revisar ({pending.length})</h2>
      {pending.length ? (
        <ul className="mt-3 space-y-3">{pending.map((r) => <Card key={r.id} review={r} />)}</ul>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Nada pendiente. 🎉</p>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-slate-900">Historial</h2>
          <ul className="mt-3 space-y-3">{rest.map((r) => <Card key={r.id} review={r} />)}</ul>
        </>
      )}
    </main>
  );
}
