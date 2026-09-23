import "server-only";

// WhatsApp vía la API oficial de Meta (WhatsApp Business Cloud API).
// Requiere una app en developers.facebook.com con el producto WhatsApp:
//   WHATSAPP_TOKEN         token permanente del sistema
//   WHATSAPP_PHONE_ID      id del número emisor
// Notas: para iniciar conversación con un alumno, Meta exige PLANTILLAS
// aprobadas (categoría "utility"). WHATSAPP_TEMPLATE_* configuran eso.

export const whatsappConfigured = Boolean(
  process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID,
);

const GRAPH = "https://graph.facebook.com/v21.0";

/** Normaliza un teléfono de México a formato E.164 (521XXXXXXXXXX). */
export function normalizePhoneMx(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;       // 10 dígitos locales
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  if (digits.length === 13 && digits.startsWith("521")) return digits;
  return digits.length >= 11 ? digits : null;           // internacional tal cual
}

async function send(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    if (!res.ok) {
      console.error("WhatsApp:", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("WhatsApp:", err);
    return false;
  }
}

/**
 * Plantilla "aviso_curso" (crearla en el WhatsApp Manager, categoría Utility):
 *   Hola {{1}}, aviso de tu curso {{2}}: {{3}}
 * Meta la aprueba normalmente en minutos.
 */
export async function sendCourseNotice(to: string, studentName: string, courseTitle: string, message: string) {
  if (!whatsappConfigured) return false;
  return send({
    to,
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NOTICE ?? "aviso_curso",
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "es_MX" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName },
            { type: "text", text: courseTitle },
            { type: "text", text: message },
          ],
        },
      ],
    },
  });
}
