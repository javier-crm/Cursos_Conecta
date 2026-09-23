import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { BillingProfileForm, RequestInvoiceButton } from "./forms";

export const metadata = { title: "Facturación" };

const money = (cents: number, currency: string) =>
  `$${(cents / 100).toLocaleString("es-MX")} ${currency}`;

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

export default async function Page() {
  const { supabase, user } = await requireUser("/panel/facturacion");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("billing_profiles")
      .select("rfc, legal_name, tax_regime, zip, cfdi_use, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, amount_cents, currency, paid_at, course:courses(title), invoices(id, status, uuid_sat)")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/panel" className="text-sm text-indigo-600 hover:underline">← Volver a mi panel</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Facturación</h1>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Mis datos fiscales</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tal como aparecen en tu constancia de situación fiscal. Los usamos para timbrar tus facturas.
        </p>
        <div className="mt-5">
          <BillingProfileForm profile={profile ?? null} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Mis compras</h2>
        {!orders?.length ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            Cuando compres un curso, aquí podrás pedir tu factura.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {orders.map((order) => {
              const course = Array.isArray(order.course) ? order.course[0] : order.course;
              const invoice = order.invoices?.find((i) => i.status === "issued" || i.status === "pending");
              return (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
                  <div>
                    <p className="font-medium text-slate-900">{course?.title}</p>
                    <p className="text-sm text-slate-500">
                      {money(order.amount_cents, order.currency)}
                      {order.paid_at && ` · pagado el ${dateFmt.format(new Date(order.paid_at))}`}
                    </p>
                  </div>
                  {invoice ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      {invoice.status === "issued" ? "Facturada" : "En proceso"}
                    </span>
                  ) : (
                    <RequestInvoiceButton orderId={order.id} disabled={!profile} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!profile && (orders?.length ?? 0) > 0 && (
          <p className="mt-2 text-sm text-amber-700">Guarda primero tus datos fiscales para poder facturar.</p>
        )}
      </section>
    </main>
  );
}
