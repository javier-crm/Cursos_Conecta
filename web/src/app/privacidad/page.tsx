export const metadata = { title: "Aviso de privacidad" };

// BORRADOR conforme a la LFPDPPP — debe revisarlo un abogado y completarse
// con la razón social y domicilio del responsable antes del lanzamiento.
const SECTIONS: [string, string][] = [
  ["Responsable", "[RAZÓN SOCIAL], con domicilio en [DOMICILIO], es responsable del tratamiento de tus datos personales conforme a este aviso."],
  ["Datos que recabamos", "Nombre, correo electrónico y teléfono al crear tu cuenta; datos fiscales (RFC, razón social, régimen, código postal) solo si solicitas factura; y registros de asistencia a las clases. Los pagos los procesa Stripe: nunca almacenamos los datos de tu tarjeta."],
  ["Finalidades", "Darte acceso a los cursos que compras, enviarte confirmaciones y recordatorios de tus clases, emitir tu factura si la pides, y atender dudas o aclaraciones. Con tu consentimiento, también podremos avisarte de próximos cursos."],
  ["Transferencias", "Compartimos datos únicamente con los proveedores necesarios para operar: Stripe (pagos), Supabase (base de datos), Zoom (clases en vivo), Facturama (timbrado fiscal) y el proveedor de correo transaccional. No vendemos tus datos a terceros."],
  ["Derechos ARCO", "Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos escribiendo al correo de contacto publicado en el sitio. Responderemos en un máximo de 20 días hábiles."],
  ["Conservación", "Conservamos tus datos mientras tengas cuenta activa y, en el caso de información fiscal y de pagos, por los plazos que exige la legislación mexicana."],
  ["Cambios a este aviso", "Cualquier modificación se publicará en esta página."],
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Aviso de privacidad</h1>
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
