"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type FeedbackState = { error?: string; message?: string } | undefined;

export async function submitSessionFeedback(_: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const { supabase, user } = await requireUser("/panel");

  const rating = Number(formData.get("rating"));
  if (!(rating >= 1 && rating <= 5)) return { error: "Elige una calificación." };

  const { error } = await supabase.from("session_feedback").insert({
    session_id: String(formData.get("session_id")),
    user_id: user.id,
    rating,
    comment: String(formData.get("comment") ?? "").trim().slice(0, 1000) || null,
  });

  if (error) {
    return error.code === "23505"
      ? { message: "Ya habías respondido. ¡Gracias!" }
      : { error: "No pudimos guardar tu respuesta." };
  }
  revalidatePath("/panel");
  return { message: "¡Gracias! Tu respuesta le llega directo al instructor." };
}
