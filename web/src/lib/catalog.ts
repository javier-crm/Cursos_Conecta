import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export type CatalogInstructor = {
  slug: string;
  display_name: string;
  topic: string | null;
  bio: string | null;
  photo_url: string | null;
};

export type CatalogSession = {
  position: number;
  title: string | null;
  starts_at: string;
  duration_minutes: number;
};

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  video_url: string | null;
  price_cents: number;
  currency: string;
  capacity: number | null;
  replay_hours: number;
  permanent_replay_price_cents: number | null;
  sales_close_at: string | null;
  instructor: CatalogInstructor;
  sessions: CatalogSession[];
  seats_taken: number;
};

const COURSE_SELECT = `id, slug, title, subtitle, description, cover_url, video_url, price_cents, currency,
  capacity, replay_hours, permanent_replay_price_cents, sales_close_at,
  instructor:instructors(slug, display_name, topic, bio, photo_url),
  live_sessions(position, title, starts_at, duration_minutes)`;

/* ---------- Datos de demostración (sin Supabase) ---------- */

function inDays(days: number, hour = 19) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DEMO_INSTRUCTORS: Record<string, CatalogInstructor> = {
  "ana-lopez": {
    slug: "ana-lopez",
    display_name: "Ana López",
    topic: "Marketing digital",
    bio: "Especialista en campañas digitales para pymes. Ha manejado presupuestos de publicidad para más de 40 negocios en México.",
    photo_url: null,
  },
  "juan-perez": {
    slug: "juan-perez",
    display_name: "Juan Pérez",
    topic: "Finanzas",
    bio: "Contador público con 10 años asesorando negocios. Traduce los números a decisiones que cualquier dueño entiende.",
    photo_url: null,
  },
  "sofia-diaz": {
    slug: "sofia-diaz",
    display_name: "Sofía Díaz",
    topic: "Ventas B2B",
    bio: "Directora comercial y mentora de equipos de venta. Construyó desde cero dos equipos que hoy facturan 8 cifras.",
    photo_url: null,
  },
};

const DEMO_COURSES: CatalogCourse[] = [
  {
    id: "demo-1",
    slug: "marketing-para-pymes",
    title: "Marketing digital para pymes",
    subtitle: "Atrae clientes sin quemar tu presupuesto",
    description:
      "En dos sesiones prácticas verás cómo armar una estrategia digital sencilla: a quién hablarle, en qué canal invertir y cómo medir si tu publicidad está dejando dinero. Saldrás con un plan aplicable a tu negocio desde la primera semana.",
    cover_url: null,
    video_url: null,
    price_cents: 99000,
    currency: "MXN",
    capacity: 50,
    replay_hours: 72,
    permanent_replay_price_cents: 29900,
    sales_close_at: inDays(20),
    instructor: DEMO_INSTRUCTORS["ana-lopez"],
    sessions: [
      { position: 1, title: "Estrategia y canales", starts_at: inDays(21), duration_minutes: 60 },
      { position: 2, title: "Campañas y medición", starts_at: inDays(23), duration_minutes: 60 },
    ],
    seats_taken: 12,
  },
  {
    id: "demo-2",
    slug: "finanzas-para-no-financieros",
    title: "Finanzas para no financieros",
    subtitle: "Entiende y controla los números de tu negocio",
    description:
      "Aprende a leer tu estado de resultados, controlar tu flujo de efectivo y ponerle precio a lo que vendes sin regalar margen. Sin tecnicismos: números claros para tomar decisiones.",
    cover_url: null,
    video_url: null,
    price_cents: 119000,
    currency: "MXN",
    capacity: 50,
    replay_hours: 72,
    permanent_replay_price_cents: 29900,
    sales_close_at: inDays(27),
    instructor: DEMO_INSTRUCTORS["juan-perez"],
    sessions: [
      { position: 1, title: "Tus números clave", starts_at: inDays(28), duration_minutes: 60 },
      { position: 2, title: "Flujo de efectivo y precios", starts_at: inDays(30), duration_minutes: 60 },
    ],
    seats_taken: 31,
  },
  {
    id: "demo-3",
    slug: "ventas-b2b-desde-cero",
    title: "Ventas B2B desde cero",
    subtitle: "Un sistema de prospección que sí funciona",
    description:
      "Un método paso a paso para conseguir reuniones con clientes empresariales: a quién buscar, qué decirle y cómo dar seguimiento sin perseguir. Incluye plantillas de mensajes listas para usar.",
    cover_url: null,
    video_url: null,
    price_cents: 99000,
    currency: "MXN",
    capacity: 40,
    replay_hours: 72,
    permanent_replay_price_cents: 29900,
    sales_close_at: inDays(34),
    instructor: DEMO_INSTRUCTORS["sofia-diaz"],
    sessions: [
      { position: 1, title: "Prospección y mensajes", starts_at: inDays(35), duration_minutes: 60 },
      { position: 2, title: "Seguimiento y cierre", starts_at: inDays(37), duration_minutes: 60 },
    ],
    seats_taken: 40,
  },
];

/* ---------- Normalización de filas de Supabase ---------- */

type RawCourse = Omit<CatalogCourse, "instructor" | "sessions" | "seats_taken"> & {
  instructor: CatalogInstructor | CatalogInstructor[] | null;
  live_sessions: CatalogSession[];
};

function normalize(row: RawCourse, seatsTaken: number): CatalogCourse {
  const instructor = Array.isArray(row.instructor) ? row.instructor[0] : row.instructor;
  return {
    ...row,
    instructor: instructor ?? {
      slug: "",
      display_name: "Por confirmar",
      topic: null,
      bio: null,
      photo_url: null,
    },
    sessions: [...row.live_sessions].sort((a, b) => a.position - b.position),
    seats_taken: seatsTaken,
  };
}

/* ---------- API pública ---------- */

export async function getPublishedCourses(): Promise<CatalogCourse[]> {
  if (!supabaseConfigured) return DEMO_COURSES;

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<RawCourse[]>();

  return (data ?? []).map((row) => normalize(row, 0));
}

export async function getCourseBySlug(slug: string): Promise<CatalogCourse | null> {
  if (!supabaseConfigured) return DEMO_COURSES.find((c) => c.slug === slug) ?? null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle<RawCourse>();
  if (!data) return null;

  const { data: seats } = await supabase.rpc("seats_taken", { p_course_id: data.id });
  return normalize(data, typeof seats === "number" ? seats : 0);
}

export function seatsLeft(course: CatalogCourse): number | null {
  if (course.capacity == null) return null;
  return Math.max(0, course.capacity - course.seats_taken);
}

export function firstSessionDate(course: CatalogCourse): Date | null {
  return course.sessions.length ? new Date(course.sessions[0].starts_at) : null;
}

export const formatPrice = (course: Pick<CatalogCourse, "price_cents" | "currency">) =>
  `$${(course.price_cents / 100).toLocaleString("es-MX")} ${course.currency}`;

export const formatSessionDate = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Monterrey",
});
