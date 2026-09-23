"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { buyBundle, type BundleBuyState } from "./actions";

export function BuyBundleButton({ slug }: { slug: string }) {
  const [state, action] = useActionState<BundleBuyState, FormData>(buyBundle, undefined);
  return (
    <form action={action} className="text-right">
      <input type="hidden" name="slug" value={slug} />
      {state?.error && <div className="mb-2"><Alert kind="error">{state.error}</Alert></div>}
      <button className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700">
        Comprar paquete
      </button>
    </form>
  );
}
