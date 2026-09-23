import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Integración con Facturama (API monoemisor, autenticación básica).
// Sandbox: https://apisandbox.facturama.mx — producción: https://api.facturama.mx
// Requiere tu CSD cargado en el panel de Facturama y los datos del emisor
// configurados ahí mismo.

export const facturamaConfigured = Boolean(
  process.env.FACTURAMA_USER && process.env.FACTURAMA_PASSWORD,
);

const BASE =
  process.env.FACTURAMA_SANDBOX === "false"
    ? "https://api.facturama.mx"
    : "https://apisandbox.facturama.mx";

const IVA_RATE = 0.16;

async function facturama(path: string, init?: RequestInit) {
  const auth = Buffer.from(
    `${process.env.FACTURAMA_USER}:${process.env.FACTURAMA_PASSWORD}`,
  ).toString("base64");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Facturama ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.status === 204 ? null : res.json();
}

export type InvoiceRequestResult = { ok: true } | { ok: false; error: string };

/** Timbra el CFDI de una orden pagada y lo envía por correo al cliente. */
export async function issueInvoiceForOrder(orderId: string, userId: string): Promise<InvoiceRequestResult> {
  if (!facturamaConfigured) {
    return { ok: false, error: "La facturación aún no está activada. Escríbenos y te la enviamos manualmente." };
  }
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status, amount_cents, currency, course:courses(title)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!order || order.status !== "paid") return { ok: false, error: "Esta orden no se puede facturar." };

  const { data: existing } = await admin
    .from("invoices")
    .select("id, status")
    .eq("order_id", order.id)
    .in("status", ["pending", "issued"])
    .maybeSingle();
  if (existing) return { ok: false, error: "Esta orden ya tiene una factura emitida o en proceso." };

  const { data: billing } = await admin
    .from("billing_profiles")
    .select("rfc, legal_name, tax_regime, zip, cfdi_use, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (!billing) return { ok: false, error: "Primero captura tus datos fiscales." };

  const course = Array.isArray(order.course) ? order.course[0] : order.course;
  const total = order.amount_cents / 100;
  const subtotal = +(total / (1 + IVA_RATE)).toFixed(2);
  const iva = +(total - subtotal).toFixed(2);

  const cfdi = {
    CfdiType: "I",
    PaymentForm: "04", // tarjeta de crédito; ajustable por método si se requiere detalle
    PaymentMethod: "PUE",
    Currency: order.currency,
    ExpeditionPlace: process.env.FACTURAMA_EXPEDITION_PLACE ?? "64000",
    Receiver: {
      Rfc: billing.rfc.toUpperCase(),
      Name: billing.legal_name.toUpperCase(),
      CfdiUse: billing.cfdi_use,
      FiscalRegime: billing.tax_regime,
      TaxZipCode: billing.zip,
    },
    Items: [
      {
        ProductCode: process.env.FACTURAMA_PRODUCT_CODE ?? "86101610",
        Description: `Curso en línea: ${course?.title ?? "curso"}`,
        UnitCode: "E48",
        Unit: "Unidad de servicio",
        Quantity: 1,
        UnitPrice: subtotal,
        Subtotal: subtotal,
        TaxObject: "02",
        Taxes: [
          { Total: iva, Name: "IVA", Base: subtotal, Rate: IVA_RATE, IsRetention: false },
        ],
        Total: total,
      },
    ],
  };

  const { data: row } = await admin
    .from("invoices")
    .insert({ order_id: order.id, total_cents: order.amount_cents })
    .select("id")
    .single();

  try {
    const issued = (await facturama("/2/cfdis", {
      method: "POST",
      body: JSON.stringify(cfdi),
    })) as { Id: string; Complement?: { TaxStamp?: { Uuid?: string } } };

    await admin
      .from("invoices")
      .update({ facturama_id: issued.Id, uuid_sat: issued.Complement?.TaxStamp?.Uuid ?? null, status: "issued" })
      .eq("id", row!.id);

    // Enviar PDF y XML por correo (si falla, la factura ya quedó timbrada)
    const email = billing.email ?? undefined;
    if (email) {
      await facturama(
        `/cfdi?cfdiType=issued&cfdiId=${issued.Id}&email=${encodeURIComponent(email)}`,
        { method: "POST" },
      ).catch(() => null);
    }
    return { ok: true };
  } catch (err) {
    await admin.from("invoices").update({ status: "failed" }).eq("id", row!.id);
    console.error("Facturama:", err);
    return { ok: false, error: "No pudimos timbrar la factura. Revisa tus datos fiscales o inténtalo más tarde." };
  }
}
