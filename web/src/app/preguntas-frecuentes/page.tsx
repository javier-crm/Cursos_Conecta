import Link from "next/link";
import { FAQS } from "@/lib/faqs";

export const metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas sobre cómo funcionan los cursos en vivo: pagos, OXXO, facturas, grabaciones, reembolsos y constancias.",
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
      <h1 className="text-3xl font-bold text-slate-900">Preguntas frecuentes</h1>
      <p className="mt-1 text-slate-600">Todo lo que necesitas saber antes de inscribirte.</p>

      <div className="mt-8 space-y-3">
        {FAQS.map((faq) => (
          <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer list-none font-semibold text-slate-900">
              <span className="flex items-center justify-between gap-4">
                {faq.q}
                <span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-indigo-50 p-6 text-center">
        <p className="font-semibold text-slate-900">¿Tu duda no está aquí?</p>
        <p className="mt-1 text-sm text-slate-600">Escríbenos y con gusto te ayudamos.</p>
        <Link href="/cursos" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">
          Ver cursos disponibles
        </Link>
      </div>
    </main>
  );
}
