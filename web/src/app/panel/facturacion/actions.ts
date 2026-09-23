"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { issueInvoiceForOrder } from "@/lib/facturama";

export type BillingState = { error?: string; message?: string } | undefined;

const RFC_RE = /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;

export async function saveBillingProfile(_: BillingState, formData: FormData): Promise<BillingState> {
  const { supabase, user } = await requireUser("/panel/facturacion");

  const rfc = String(formData.get("rfc") ?? "").trim().toUpperCase();
  const legalName = String(formData.get("legal_name") ?? "").trim().toUpperCase();
  const zip = String(formData.get("zip") ?? "").trim();

  if (!RFC_RE.test(rfc)) return { error: "El RFC no tiene un formato válido." };
  if (legalName.length < 3) return { error: "Escribe la razón social tal como aparece en tu constancia." };
  if (!/^\d{5}$/.test(zip)) return { error: "El código postal debe tener 5 dígitos." };

  const { error } = await supabase.from("billing_profiles").upsert({
    user_id: user.id,
    rfc,
    legal_name: legalName,
    tax_regime: String(formData.get("tax_regime")),
    zip,
    cfdi_use: String(formData.get("cfdi_use")),
    email: String(formData.get("email") ?? "").trim() || user.email,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No pudimos guardar tus datos. Intenta de nuevo." };

  revalidatePath("/panel/facturacion");
  return { message: "Datos fiscales guardados." };
}

export async function requestInvoice(_: BillingState, formData: FormData): Promise<BillingState> {
  const { user } = await requireUser("/panel/facturacion");
  const orderId = String(formData.get("order_id"));

  const result = await issueInvoiceForOrder(orderId, user.id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/panel/facturacion");
  return { message: "¡Factura emitida! Te la enviamos por correo (PDF y XML)." };
}
