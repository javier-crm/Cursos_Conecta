"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { payAction } from "./actions";

type Props = {
  slug: string;
  priceLabel: string;
  permanentReplayLabel: string | null; // null = no se vende
};

export function CheckoutForm({ slug, priceLabel, permanentReplayLabel }: Props) {
  const [state, action] = useActionState(payAction, undefined);

  return (
    <form action={action} className="mt-6 space-y-4 text-left">
      <input type="hidden" name="slug" value={slug} />

      {permanentReplayLabel && (
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm">
          <input type="checkbox" name="permanent_replay" className="mt-0.5" />
          <span>
            <span className="font-medium text-slate-900">Acceso permanente a las grabaciones</span>
            <span className="block text-slate-500">
              Conserva las grabaciones para siempre por {permanentReplayLabel} adicionales.
            </span>
          </span>
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">¿Tienes un cupón?</span>
        <input
          name="coupon"
          placeholder="CÓDIGO"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </label>

      {state?.error && <Alert kind="error">{state.error}</Alert>}

      <SubmitButton pendingText="Redirigiendo al pago…">Pagar {priceLabel}</SubmitButton>
      <p className="text-center text-xs text-slate-500">
        Pago seguro con Stripe · tarjeta, OXXO o meses sin intereses
      </p>
    </form>
  );
}
