import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { stripeConfigured, getStripe } from "@/lib/stripe";

export const metadata = { title: "Pago recibido" };

export default async function Page({ searchParams }: PageProps<"/pago/exito">) {
  const { user } = await requireUser("/panel");
  const { session_id } = await searchParams;

  // Con OXXO el pago queda pendiente hasta que la tienda lo confirma.
  let pendingOxxo = false;
  if (supabaseConfigured && stripeConfigured && typeof session_id === "string") {
    const session = await getStripe()
      .checkout.sessions.retrieve(session_id)
      .catch(() => null);
    if (session && session.metadata?.user_id === user.id) {
      pendingOxxo = session.payment_status !== "paid";
      // Respaldo por si el webhook aún no llega: registrar el método
      if (session.payment_status === "paid" && session.metadata?.order_id) {
        const { fulfillOrder } = await import("@/lib/checkout");
        await fulfillOrder(
          session.metadata.order_id,
          typeof session.payment_intent === "string" ? session.payment_intent : null,
          session.payment_method_types?.[0] ?? "card",
        );
      }
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {pendingOxxo ? (
          <>
            <p className="text-4xl">🕗</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Pago en proceso</h1>
            <p className="mt-2 text-slate-600">
              Recibimos tu solicitud. En cuanto OXXO confirme tu pago (puede tardar hasta 1 día hábil),
              tu lugar quedará reservado y te avisaremos por correo.
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl">🎉</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">¡Ya tienes tu lugar!</h1>
            <p className="mt-2 text-slate-600">
              Tu pago fue confirmado. Encontrarás las fechas, el acceso a las clases y tu factura en tu panel.
            </p>
          </>
        )}
        <Link
          href="/panel"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Ir a mi panel
        </Link>
      </div>
    </main>
  );
}
