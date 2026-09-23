"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type ReviewState = { error?: string; message?: string } | undefined;

export async function submitReview(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const { supabase, user, profile } = await requireUser("/panel");

  const rating = Number(formData.get("rating"));
  if (!(rating >= 1 && rating <= 5)) return { error: "Elige una calificación de 1 a 5 estrellas." };

  const comment = String(formData.get("comment") ?? "").trim().slice(0, 1000) || null;

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    course_id: String(formData.get("course_id")),
    rating,
    comment,
    author_name: profile?.full_name?.trim() || "Alumno verificado",
  });

  if (error) {
    return error.code === "23505"
      ? { error: "Ya habías calificado este curso. ¡Gracias!" }
      : { error: "No pudimos guardar tu reseña. Intenta de nuevo." };
  }

  revalidatePath("/panel");
  return { message: "¡Gracias por tu opinión! La publicaremos en cuanto se revise." };
}
