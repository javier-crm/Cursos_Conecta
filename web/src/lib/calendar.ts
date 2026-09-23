// Enlaces de calendario para las sesiones en vivo.

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(input: {
  title: string;
  startsAt: Date;
  durationMinutes: number;
  details: string;
}): string {
  const end = new Date(input.startsAt.getTime() + input.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${fmt(input.startsAt)}/${fmt(end)}`,
    details: input.details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildIcs(input: {
  uid: string;
  title: string;
  startsAt: Date;
  durationMinutes: number;
  description: string;
  url: string;
}): string {
  const end = new Date(input.startsAt.getTime() + input.durationMinutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cursos en Vivo//ES",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(input.startsAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${input.title.replace(/([,;])/g, "\\$1")}`,
    `DESCRIPTION:${input.description.replace(/([,;])/g, "\\$1")}\\n${input.url}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu clase empieza en 30 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
