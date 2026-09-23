import "server-only";

// Correos transaccionales con Resend. Mientras no haya RESEND_API_KEY,
// las funciones no hacen nada (la compra sigue funcionando sin correo).

export const emailConfigured = Boolean(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Cursos en Vivo <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!emailConfigured || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("Resend:", res.status, await res.text());
  } catch (err) {
    console.error("Resend:", err);
  }
}

const layout = (body: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#94a3b8">Cursos en Vivo · <a href="${SITE}" style="color:#6366f1">${SITE.replace(/^https?:\/\//, "")}</a></p>
  </div>`;

export function purchaseConfirmationEmail(courseTitle: string, sessions: { title: string | null; starts_at: string; position: number }[]) {
  const fmt = new Intl.DateTimeFormat("es-MX", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
    timeZone: "America/Monterrey",
  });
  const list = sessions
    .map((s) => `<li style="margin:4px 0">${s.title ?? `Sesión ${s.position}`}: ${fmt.format(new Date(s.starts_at))} (hora de Monterrey)</li>`)
    .join("");
  return layout(`
    <h1 style="font-size:22px">¡Ya tienes tu lugar! 🎉</h1>
    <p>Tu inscripción a <strong>${courseTitle}</strong> está confirmada.</p>
    <ul style="padding-left:18px">${list}</ul>
    <p>El día de la clase, entra desde tu panel con el botón <strong>«Entrar a la clase»</strong>:</p>
    <p><a href="${SITE}/panel" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ir a mi panel</a></p>
    <p style="color:#64748b;font-size:14px">Si no puedes asistir en vivo, la grabación estará disponible en tu panel durante un tiempo limitado después de cada sesión.</p>
  `);
}

export function reminderEmail(courseTitle: string, sessionLabel: string, startsAt: Date, kind: "24h" | "1h") {
  const fmt = new Intl.DateTimeFormat("es-MX", {
    weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
    timeZone: "America/Monterrey",
  });
  const when = kind === "24h" ? "mañana" : "en una hora";
  return layout(`
    <h1 style="font-size:22px">Tu clase es ${when} ⏰</h1>
    <p><strong>${courseTitle}</strong> — ${sessionLabel}</p>
    <p>${fmt.format(startsAt)} (hora de Monterrey)</p>
    <p><a href="${SITE}/panel" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Entrar desde mi panel</a></p>
    <p style="color:#64748b;font-size:14px">El botón «Entrar a la clase» se activa 15 minutos antes.</p>
  `);
}
