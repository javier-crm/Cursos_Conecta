-- Datos de ejemplo para desarrollo (ejecutar en el SQL Editor de Supabase
-- DESPUÉS de correr las migraciones). No usar en producción.

insert into public.instructors (slug, display_name, topic, bio, commission_pct) values
  ('ana-lopez',  'Ana López',  'Marketing digital', 'Especialista en campañas para pymes.', 70),
  ('juan-perez', 'Juan Pérez', 'Finanzas',          'Contador con 10 años asesorando negocios.', 70),
  ('sofia-diaz', 'Sofía Díaz', 'Ventas B2B',        'Directora comercial y mentora de equipos de venta.', 70);

insert into public.courses (instructor_id, slug, title, subtitle, price_cents, capacity, status, sales_close_at)
select i.id, c.slug, c.title, c.subtitle, c.price_cents, 50, 'published', now() + interval '20 days'
from (values
  ('ana-lopez',  'marketing-para-pymes',   'Marketing digital para pymes',   'Atrae clientes sin quemar tu presupuesto', 99000),
  ('juan-perez', 'finanzas-para-no-financieros', 'Finanzas para no financieros', 'Entiende y controla los números de tu negocio', 119000),
  ('sofia-diaz', 'ventas-b2b-desde-cero',  'Ventas B2B desde cero',          'Un sistema de prospección que sí funciona', 99000)
) as c(instructor_slug, slug, title, subtitle, price_cents)
join public.instructors i on i.slug = c.instructor_slug;

insert into public.live_sessions (course_id, position, title, starts_at, duration_minutes)
select id, 1, 'Sesión 1', ((current_date + 21) + time '19:00') at time zone 'America/Monterrey', 60 from public.courses
union all
select id, 2, 'Sesión 2', ((current_date + 23) + time '19:00') at time zone 'America/Monterrey', 60 from public.courses;
