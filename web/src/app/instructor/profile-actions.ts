"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileState = { error?: string; message?: string } | undefined;

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export async function updateInstructorProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const { user } = await requireRole(["instructor", "admin"], "/instructor");
  const admin = createAdminClient();

  const { data: instructor } = await admin
    .from("instructors")
    .select("id, slug, photo_url")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!instructor) return { error: "Tu cuenta no está ligada a un perfil de conferencista." };

  let photoUrl = instructor.photo_url;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return { error: "La foto debe pesar menos de 4 MB." };
    if (!/^image\/(jpeg|png|webp)$/.test(photo.type)) return { error: "La foto debe ser JPG, PNG o WebP." };

    const extension = photo.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${instructor.slug}-${Date.now()}.${extension}`;
    const { error: uploadError } = await admin.storage
      .from("instructores")
      .upload(path, photo, { contentType: photo.type, upsert: true });
    if (uploadError) return { error: "No pudimos subir la foto. Intenta de nuevo." };

    photoUrl = admin.storage.from("instructores").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await admin
    .from("instructors")
    .update({
      headline: String(formData.get("headline") ?? "").trim().slice(0, 120) || null,
      bio: String(formData.get("bio") ?? "").trim().slice(0, 2000) || null,
      credentials: String(formData.get("credentials") ?? "").trim().slice(0, 2000) || null,
      photo_url: photoUrl,
    })
    .eq("id", instructor.id);
  if (error) return { error: "No se pudo guardar tu perfil." };

  revalidatePath("/instructor");
  revalidatePath("/instructores");
  revalidatePath(`/instructores/${instructor.slug}`);
  revalidateTag("public-instructors", "max");
  return { message: "Perfil actualizado. Así te verán los alumnos en el sitio." };
}
