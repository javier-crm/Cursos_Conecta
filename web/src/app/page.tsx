import Link from "next/link";

const STEPS = [
  { title: "Elige tu curso", text: "Dos clases en vivo de una hora, con cupo limitado y fecha definida." },
  { title: "Paga en línea", text: "Tarjeta, OXXO o meses sin intereses. Factura disponible si la necesitas." },
  { title: "Aprende en vivo", text: "Entra a la clase desde tu panel y pregunta directo al instructor." },
  { title: "Repasa la grabación", text: "Disponible 72 horas después de cada clase por si no pudiste asistir." },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Clases en vivo · Cupo limitado
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-slate-900 sm:text-5xl">
            Aprende en vivo con expertos, sin rodeos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Cursos prácticos de dos sesiones en vivo. Si no puedes asistir, la grabación queda disponible 72 horas.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/cursos" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
              Ver próximos cursos
            </Link>
            <Link href="/registro" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
