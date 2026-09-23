"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { requestInvoice, saveBillingProfile, type BillingState } from "./actions";

const TAX_REGIMES = [
  ["601", "601 · General de Ley Personas Morales"],
  ["603", "603 · Personas Morales con Fines no Lucrativos"],
  ["605", "605 · Sueldos y Salarios"],
  ["606", "606 · Arrendamiento"],
  ["612", "612 · Personas Físicas con Actividades Empresariales y Profesionales"],
  ["616", "616 · Sin obligaciones fiscales"],
  ["621", "621 · Incorporación Fiscal"],
  ["626", "626 · Régimen Simplificado de Confianza (RESICO)"],
] as const;

const CFDI_USES = [
  ["G03", "G03 · Gastos en general"],
  ["D10", "D10 · Pagos por servicios educativos"],
  ["P01", "P01 · Por definir"],
] as const;

function Feedback({ state }: { state: BillingState }) {
  if (state?.error) return <Alert kind="error">{state.error}</Alert>;
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;
  return null;
}

type Profile = {
  rfc: string;
  legal_name: string;
  tax_regime: string;
  zip: string;
  cfdi_use: string;
  email: string | null;
} | null;

export function BillingProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(saveBillingProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="RFC" name="rfc" defaultValue={profile?.rfc} placeholder="XAXX010101000" required />
        <Field label="Código postal fiscal" name="zip" defaultValue={profile?.zip} inputMode="numeric" maxLength={5} required />
      </div>
      <Field
        label="Razón social (sin régimen societario, como en tu constancia)"
        name="legal_name"
        defaultValue={profile?.legal_name}
        required
      />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Régimen fiscal</span>
        <select
          name="tax_regime"
          defaultValue={profile?.tax_regime ?? "612"}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          {TAX_REGIMES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Uso de CFDI</span>
        <select
          name="cfdi_use"
          defaultValue={profile?.cfdi_use ?? "G03"}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          {CFDI_USES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <Field label="Correo para recibir la factura" name="email" type="email" defaultValue={profile?.email ?? ""} />
      <Feedback state={state} />
      <SubmitButton pendingText="Guardando…">Guardar datos fiscales</SubmitButton>
    </form>
  );
}

export function RequestInvoiceButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const [state, action] = useActionState(requestInvoice, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <Feedback state={state} />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
      >
        Solicitar factura
      </button>
    </form>
  );
}
