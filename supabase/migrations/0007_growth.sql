-- Mejoras de venta: lista de espera, carritos, cupones destacados,
-- paquetes, video de presentación y referidos.

-- 1) Lista de espera (cupo agotado / ventas cerradas)
create table public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  phone        text,
  notified_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (course_id, email)
);
alter table public.waitlist enable row level security;
create policy "admin lista de espera" on public.waitlist for select using (is_admin());
-- (los registros entran desde el servidor con service role)

-- 2) Recuperación de carritos
alter table public.orders add column recovery_sent_at timestamptz;

-- 3) Cupones destacados (se muestran en la página del curso) y referidos
alter table public.coupons add column featured boolean not null default false;
alter table public.coupons add column referrer_user_id uuid references public.profiles(id);

-- 4) Paquetes de cursos
create table public.bundles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text,
  price_cents  integer not null check (price_cents > 0),
  currency     text not null default 'MXN',
  status       course_status not null default 'draft',
  created_at   timestamptz not null default now()
);
create table public.bundle_courses (
  bundle_id  uuid not null references public.bundles(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  primary key (bundle_id, course_id)
);
alter table public.bundles enable row level security;
alter table public.bundle_courses enable row level security;
create policy "paquetes públicos" on public.bundles for select
  using (status = 'published' or is_admin());
create policy "admin paquetes" on public.bundles for all using (is_admin()) with check (is_admin());
create policy "cursos de paquete públicos" on public.bundle_courses for select using (
  exists (select 1 from bundles b where b.id = bundle_id and (b.status = 'published' or is_admin()))
);
create policy "admin cursos de paquete" on public.bundle_courses for all using (is_admin()) with check (is_admin());

-- Una orden puede ser de un curso O de un paquete
alter table public.orders alter column course_id drop not null;
alter table public.orders add column bundle_id uuid references public.bundles(id);
alter table public.orders add constraint orders_course_or_bundle
  check (course_id is not null or bundle_id is not null);

-- 5) Video de presentación del curso
alter table public.courses add column video_url text;
