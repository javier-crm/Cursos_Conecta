"use client";

import { useState } from "react";

export function ReferralCard({ code, uses, siteUrl }: { code: string; uses: number; siteUrl: string }) {
  const [copied, setCopied] = useState(false);

  const shareText = `Te recomiendo estos cursos en vivo. Usa mi código ${code} al pagar y te dan 10% de descuento: ${siteUrl}/cursos`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el usuario puede seleccionar el texto */
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50/60 p-6">
      <h2 className="text-lg font-semibold text-slate-900">🎁 Recomienda y comparte</h2>
      <p className="mt-1 text-sm text-slate-600">
        Comparte tu código: cada amigo que lo use recibe <b>10% de descuento</b> en su curso.
        {uses > 0 && <> Ya lo han usado <b>{uses}</b> {uses === 1 ? "persona" : "personas"}.</>}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code className="select-all rounded-lg border border-indigo-200 bg-white px-4 py-2 font-mono text-lg font-bold text-indigo-700">
          {code}
        </code>
        <button onClick={copy} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
          {copied ? "¡Copiado!" : "Copiar código"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Compartir por WhatsApp
        </a>
      </div>
    </section>
  );
}
