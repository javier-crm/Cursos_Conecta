"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { joinWaitlist, type WaitlistState } from "./waitlist-actions";

export function WaitlistForm({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<WaitlistState, FormData>(joinWaitlist, undefined);

  if (state?.message) return <Alert kind="success">{state.message}</Alert>;

  return (
    <form action={action} className="mt-4 space-y-3 text-left">
      <p className="text-sm font-medium text-slate-700">
        Déjanos tus datos y te avisamos si se libera un lugar o se abre nueva fecha:
      </p>
      <input type="hidden" name="course_id" value={courseId} />
      <Field label="Nombre" name="full_name" required />
      <Field label="Correo" name="email" type="email" required />
      <Field label="WhatsApp (opcional)" name="phone" type="tel" />
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <SubmitButton pendingText="Registrando…">Avisarme cuando haya lugar</SubmitButton>
    </form>
  );
}
