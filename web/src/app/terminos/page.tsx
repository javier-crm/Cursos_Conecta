export const metadata = { title: "Términos y condiciones" };

// BORRADOR — debe revisarlo un abogado antes del lanzamiento.
const SECTIONS: [string, string][] = [
  ["1. El servicio", "Ofrecemos cursos en línea impartidos en vivo por videoconferencia. Cada curso indica sus fechas, horarios (hora de Monterrey), duración, cupo y precio en su página de venta."],
  ["2. Inscripción y pago", "El acceso se otorga al confirmarse el pago. Los pagos con tarjeta se confirman al instante; los pagos en OXXO pueden tardar hasta 1 día hábil y quedan sujetos a disponibilidad de cupo al momento de la confirmación."],
  ["3. Grabaciones", "Las sesiones se graban. La grabación queda disponible en tu panel por el tiempo indicado en cada curso (normalmente 72 horas después de cada sesión), salvo que hayas adquirido el acceso permanente. Las grabaciones son para tu uso personal: está prohibido descargarlas, compartirlas o revenderlas."],
  ["4. Reembolsos", "Puedes solicitar reembolso completo hasta 48 horas antes de la primera sesión escribiéndonos por correo. Después de ese momento, o si ya asististe a una sesión o accediste a una grabación, no hay reembolso. Si nosotros cancelamos un curso, te devolvemos el 100% o te ofrecemos cambio a otra fecha, a tu elección."],
  ["5. Cambios de fecha", "Si un instructor no puede impartir una sesión, la reprogramaremos avisándote por correo. Si la nueva fecha no te funciona, aplica el reembolso completo."],
  ["6. Conducta", "Nos reservamos el derecho de retirar el acceso, sin reembolso, a quien comparta los enlaces de clase o grabación, interrumpa las sesiones o falte al respeto a instructores o participantes."],
  ["7. Facturación", "Emitimos CFDI a quien lo solicite desde su panel capturando sus datos fiscales. Las ventas no facturadas se incluyen en la factura global mensual conforme a la normativa del SAT."],
  ["8. Propiedad intelectual", "Los materiales, grabaciones y contenidos de los cursos pertenecen a la plataforma y a sus instructores. Tu inscripción te da una licencia de uso personal, no transferible."],
  ["9. Limitación de responsabilidad", "Los cursos tienen fines formativos. Las decisiones que tomes con base en su contenido son tu responsabilidad."],
  ["10. Contacto", "Para cualquier tema relacionado con estos términos, escríbenos al correo de contacto publicado en el sitio."],
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: septiembre de 2026 · Documento borrador, pendiente de revisión legal.</p>
      <div className="mt-6 space-y-6">
        {SECTIONS.map(([title, body]) => (
          <section key={title}>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 leading-relaxed text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
