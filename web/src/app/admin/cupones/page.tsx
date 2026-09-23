import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CouponForm } from "../forms";
import { toggleCoupon } from "../crud-actions";

export const metadata = { title: "Cupones" };

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Monterrey" });

export default async function Page() {
  await requireRole(["admin"], "/admin/cupones");
  const admin = createAdminClient();

  const [{ data: coupons }, { data: courses }] = await Promise.all([
    admin
      .from("coupons")
      .select("id, code, percent_off, amount_off_cents, max_redemptions, redeemed_count, expires_at, active, course:courses(title)")
      .order("created_at", { ascending: false }),
    admin.from("courses").select("id, title").order("title"),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Cupones</h1>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Crear cupón</h2>
        <div className="mt-4">
          <CouponForm courses={courses ?? []} />
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Descuento</th>
              <th className="px-4 py-2.5 font-medium">Curso</th>
              <th className="px-4 py-2.5 font-medium">Usos</th>
              <th className="px-4 py-2.5 font-medium">Expira</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((coupon) => {
              const course = Array.isArray(coupon.course) ? coupon.course[0] : coupon.course;
              return (
                <tr key={coupon.id} className={`border-t border-slate-100 ${coupon.active ? "" : "opacity-50"}`}>
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{coupon.code}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {coupon.percent_off ? `${coupon.percent_off}%` : `$${((coupon.amount_off_cents ?? 0) / 100).toLocaleString("es-MX")}`}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{course?.title ?? "Todos"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {coupon.redeemed_count}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {coupon.expires_at ? dateFmt.format(new Date(coupon.expires_at)) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={toggleCoupon}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <input type="hidden" name="active" value={String(!coupon.active)} />
                      <button className="text-sm font-medium text-indigo-600 hover:underline">
                        {coupon.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {!coupons?.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Sin cupones todavía.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
