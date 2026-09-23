"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateInstructorProfile, type ProfileState } from "./profile-actions";

type Props = {
  slug: string;
  headline: string | null;
  bio: string | null;
  credentials: string | null;
  photoUrl: string | null;
};

export function ProfileForm({ slug, headline, bio, credentials, photoUrl }: Props) {
  const [state, action] = useActionState<ProfileState, FormData>(updateInstructorProfile, undefined);

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-6">
      <summary className="cursor-pointer font-semibold text-slate-900">
        Mi perfil público{" "}
        <span className="text-sm font-normal text-slate-500">
          — foto, credenciales y presentación ·{" "}
          <Link href={`/instructores/${slug}`} className="text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
            ver mi página
          </Link>
        </span>
      </summary>
      <form action={action} className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Tu foto actual" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">📷</div>
          )}
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">Foto (JPG/PNG, máx. 4 MB)</span>
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
          </label>
        </div>
        <Field
          label="Titular (una línea que te presente)"
          name="headline"
          defaultValue={headline ?? ""}
          placeholder="Ej. Director comercial · 15 años construyendo equipos de venta"
          maxLength={120}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Acerca de ti</span>
          <textarea name="bio" rows={4} defaultValue={bio ?? ""} maxLength={2000} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Credenciales (una por línea: certificaciones, logros, empresas)</span>
          <textarea
            name="credentials"
            rows={4}
            defaultValue={credentials ?? ""}
            maxLength={2000}
            placeholder={"MBA por el ITESM\nEx director en Empresa X\n+500 alumnos capacitados"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        {state?.error && <Alert kind="error">{state.error}</Alert>}
        {state?.message && <Alert kind="success">{state.message}</Alert>}
        <SubmitButton pendingText="Guardando…">Guardar perfil público</SubmitButton>
      </form>
    </details>
  );
}
