"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full px-4 py-2.5 disabled:opacity-60"
    >
      {pending ? (pendingText ?? "Un momento…") : children}
    </button>
  );
}
