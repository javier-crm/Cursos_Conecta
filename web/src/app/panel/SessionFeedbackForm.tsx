"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui";
import { submitSessionFeedback, type FeedbackState } from "./feedback-actions";

export function SessionFeedbackForm({ sessionId }: { sessionId: string }) {
  const [state, action] = useActionState<FeedbackState, FormData>(submitSessionFeedback, undefined);
  const [rating, setRating] = useState(0);

  if (state?.message) return <p className="mt-2 text-sm text-emerald-600">{state.message}</p>;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-indigo-600 hover:underline">
        📝 ¿Cómo estuvo esta clase? (privado, solo lo ve el instructor)
      </summary>
      <form action={action} className="mt-2 space-y-2 rounded-lg bg-white p-3">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1" role="radiogroup" aria-label="Calificación de la clase">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} de 5`}
              onClick={() => setRating(star)}
              className={`text-xl ${star <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          name="comment"
          rows={2}
          maxLength={1000}
          placeholder="¿Qué mejorarías? ¿Qué te faltó? (opcional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Enviar
        </button>
      </form>
    </details>
  );
}
