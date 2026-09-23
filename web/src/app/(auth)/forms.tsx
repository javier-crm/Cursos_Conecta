"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
} from "./actions";

function Feedback({ state }: { state?: { error?: string; message?: string } }) {
  if (state?.error) return <Alert kind="error">{state.error}</Alert>;
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;
  return null;
}

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continuar con Google
      </button>
    </form>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
      <span className="h-px flex-1 bg-slate-200" /> o <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <>
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Correo" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <div className="text-right text-sm">
          <Link href="/recuperar" className="text-indigo-600 hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        <Feedback state={state} />
        <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      </form>
    </>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;
  return (
    <>
      <GoogleButton next={next} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Nombre completo" name="full_name" autoComplete="name" required />
        <Field label="Correo" name="email" type="email" autoComplete="email" required />
        <Field label="WhatsApp (opcional)" name="phone" type="tel" autoComplete="tel" placeholder="81 1234 5678" />
        <Field label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" name="terms" className="mt-1" required />
          <span>
            Acepto los <Link href="/terminos" className="text-indigo-600 hover:underline">términos y condiciones</Link> y
            el <Link href="/privacidad" className="text-indigo-600 hover:underline">aviso de privacidad</Link>.
          </span>
        </label>
        <Feedback state={state} />
        <SubmitButton pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>
    </>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Feedback state={state} />
      <SubmitButton pendingText="Enviando…">Enviar enlace</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <Field label="Confirmar contraseña" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      <Feedback state={state} />
      <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
