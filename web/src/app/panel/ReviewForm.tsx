"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { submitReview } from "./review-actions";

export function ReviewForm({ courseId }: { courseId: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);

  if (state?.message) return <Alert kind="success">{state.message}</Alert>;

  return (
    <form action={action} className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
      <p className="text-sm font-semibold text-slate-900">¿Qué te pareció el curso?</p>
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} estrellas`}
            onClick={() => setRating(star)}
            className={`text-2xl transition ${star <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        maxLength={1000}
        placeholder="Cuéntanos qué aprendiste o qué mejorarías (opcional)"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
      {state?.error && <div className="mt-2"><Alert kind="error">{state.error}</Alert></div>}
      <div className="mt-3">
        <SubmitButton pendingText="Enviando…">Enviar reseña</SubmitButton>
      </div>
    </form>
  );
}
