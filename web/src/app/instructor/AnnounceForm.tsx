"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { sendAnnouncement, type AnnounceState } from "./announce-actions";

export function AnnounceForm({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<AnnounceState, FormData>(sendAnnouncement, undefined);

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
        📣 Enviar aviso a los inscritos (correo + WhatsApp)
      </summary>
      <form action={action} className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4">
        <input type="hidden" name="course_id" value={courseId} />
        <textarea
          name="body"
          rows={3}
          required
          maxLength={800}
          placeholder="Ej. Ya está disponible el material de la sesión 1. Recuerden traer sus dudas mañana."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <input
          name="link_url"
          type="url"
          placeholder="Link opcional (documento, material, etc.) — https://…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        {state?.message && <Alert kind="success">{state.message}</Alert>}
        <SubmitButton pendingText="Enviando…">Enviar aviso</SubmitButton>
      </form>
    </details>
  );
}
