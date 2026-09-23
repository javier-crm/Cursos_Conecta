-- =============================================================
-- Plataforma de cursos en vivo — esquema inicial
-- Cobro por curso, varios instructores con comisión,
-- sesiones en vivo con grabación que expira, facturación CFDI.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Tipos ----------
create type user_role        as enum ('student', 'instructor', 'admin');
create type course_status    as enum ('draft', 'published', 'archived');
create type order_status     as enum ('pending', 'paid', 'refunded', 'expired', 'failed');
create type enrollment_status as enum ('active', 'revoked');
create type invoice_status   as enum ('pending', 'issued', 'cancelled', 'failed');
create type payout_status    as enum ('pending', 'paid');

-- ---------- Perfiles (1:1 con auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        user_role not null default 'student',
  created_at  timestamptz not null default now()
);

-- ---------- Instructores ----------
create table public.instructors (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid unique references public.profiles(id) on delete set null,
  slug            text unique not null,
  display_name    text not null,
  topic           text,
  bio             text,
  photo_url       text,
  -- Porcentaje de cada venta que le corresponde al instructor (0–100)
  commission_pct  numeric(5,2) not null default 70 check (commission_pct between 0 and 100),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ---------- Cursos ----------
create table public.courses (
  id                            uuid primary key default gen_random_uuid(),
  instructor_id                 uuid not null references public.instructors(id),
  slug                          text unique not null,
  title                         text not null,
  subtitle                      text,
  description                   text,
  cover_url                     text,
  price_cents                   integer not null check (price_cents >= 0),
  currency                      text not null default 'MXN',
  capacity                      integer check (capacity > 0),          -- null = sin límite
  -- Horas que la grabación queda disponible después de cada sesión
  replay_hours                  integer not null default 72,
  -- Precio del acceso permanente a grabaciones (null = no se vende)
  permanent_replay_price_cents  integer check (permanent_replay_price_cents >= 0),
  -- Cierre de ventas: tarjeta hasta este momento; OXXO se cierra 3 días antes
  sales_close_at                timestamptz,
  status                        course_status not null default 'draft',
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create index on public.courses (instructor_id);
create index on public.courses (status);

-- ---------- Sesiones en vivo (datos públicos) ----------
create table public.live_sessions (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  position          smallint not null default 1,
  title             text,
  starts_at         timestamptz not null,
  duration_minutes  integer not null default 60,
  created_at        timestamptz not null default now(),
  unique (course_id, position)
);
create index on public.live_sessions (starts_at);

-- ---------- Datos privados de la sesión (solo inscritos) ----------
-- El link de Zoom y la grabación NUNCA se exponen en tablas públicas.
create table public.live_session_access (
  session_id             uuid primary key references public.live_sessions(id) on delete cascade,
  zoom_meeting_id        text,
  join_url               text,
  recording_provider     text,          -- 'bunny' | 'mux'
  recording_asset_id     text,
  recording_ready_at     timestamptz,
  recording_expires_at   timestamptz    -- ready_at + replay_hours (para quien no compró acceso permanente)
);

-- ---------- Cupones ----------
create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  percent_off       numeric(5,2) check (percent_off between 0 and 100),
  amount_off_cents  integer check (amount_off_cents >= 0),
  course_id         uuid references public.courses(id) on delete cascade,  -- null = todos
  max_redemptions   integer,
  redeemed_count    integer not null default 0,
  expires_at        timestamptz,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  check (percent_off is not null or amount_off_cents is not null)
);

-- ---------- Órdenes (una por compra de curso) ----------
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id),
  course_id                   uuid not null references public.courses(id),
  coupon_id                   uuid references public.coupons(id),
  status                      order_status not null default 'pending',
  amount_cents                integer not null,
  currency                    text not null default 'MXN',
  includes_permanent_replay   boolean not null default false,
  payment_method              text,        -- 'card' | 'oxxo' | ...
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  paid_at                     timestamptz,
  refunded_at                 timestamptz,
  created_at                  timestamptz not null default now()
);
create index on public.orders (user_id);
create index on public.orders (course_id, status);

-- ---------- Inscripciones (acceso al curso) ----------
create table public.enrollments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  course_id          uuid not null references public.courses(id) on delete cascade,
  order_id           uuid references public.orders(id),
  status             enrollment_status not null default 'active',
  permanent_replay   boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- Asistencia ----------
create table public.attendance (
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- ---------- Datos fiscales del alumno ----------
create table public.billing_profiles (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  rfc         text not null,
  legal_name  text not null,
  tax_regime  text not null,   -- clave SAT, p.ej. '612'
  zip         text not null,
  cfdi_use    text not null default 'G03',
  email       text,
  updated_at  timestamptz not null default now()
);

-- ---------- Facturas CFDI ----------
create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders(id),      -- null en factura global
  is_global      boolean not null default false,
  period_start   date,                                    -- solo factura global
  period_end     date,
  facturapi_id   text unique,
  uuid_sat       text,
  status         invoice_status not null default 'pending',
  total_cents    integer,
  created_at     timestamptz not null default now()
);
create index on public.invoices (order_id);

-- ---------- Pagos a instructores ----------
create table public.instructor_payouts (
  id                      uuid primary key default gen_random_uuid(),
  instructor_id           uuid not null references public.instructors(id),
  period_start            date not null,
  period_end              date not null,
  gross_cents             integer not null,
  instructor_share_cents  integer not null,
  status                  payout_status not null default 'pending',
  reference               text,      -- folio de transferencia / factura del instructor
  paid_at                 timestamptz,
  created_at              timestamptz not null default now(),
  unique (instructor_id, period_start, period_end)
);

-- =============================================================
-- Funciones auxiliares
-- =============================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_instructor_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from instructors where profile_id = auth.uid();
$$;

create or replace function public.is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enrollments
    where user_id = auth.uid() and course_id = p_course_id and status = 'active'
  );
$$;

-- Lugares ocupados (inscripciones activas + órdenes pendientes recientes, p.ej. OXXO)
create or replace function public.seats_taken(p_course_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select
    (select count(*) from enrollments where course_id = p_course_id and status = 'active')::int
  + (select count(*) from orders
       where course_id = p_course_id and status = 'pending'
         and created_at > now() - interval '3 days')::int;
$$;

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Evitar que un usuario se cambie su propio rol
create or replace function public.prevent_role_self_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Row Level Security
-- Escrituras sensibles (órdenes, inscripciones, facturas, pagos)
-- se hacen solo desde el servidor con la service role key.
-- =============================================================

alter table public.profiles             enable row level security;
alter table public.instructors          enable row level security;
alter table public.courses              enable row level security;
alter table public.live_sessions        enable row level security;
alter table public.live_session_access  enable row level security;
alter table public.coupons              enable row level security;
alter table public.orders               enable row level security;
alter table public.enrollments          enable row level security;
alter table public.attendance           enable row level security;
alter table public.billing_profiles     enable row level security;
alter table public.invoices             enable row level security;
alter table public.instructor_payouts   enable row level security;

-- Perfiles
create policy "ver mi perfil"        on public.profiles for select using (id = auth.uid() or is_admin());
create policy "editar mi perfil"     on public.profiles for update using (id = auth.uid() or is_admin());

-- Instructores: públicos si están activos
create policy "instructores públicos" on public.instructors for select using (active or is_admin() or profile_id = auth.uid());
create policy "admin instructores"    on public.instructors for all using (is_admin()) with check (is_admin());
create policy "instructor edita su perfil" on public.instructors for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Cursos: publicados son públicos; el instructor ve y edita los suyos
create policy "cursos públicos" on public.courses for select
  using (status = 'published' or is_admin() or instructor_id = my_instructor_id());
create policy "admin cursos"    on public.courses for all using (is_admin()) with check (is_admin());
create policy "instructor edita sus cursos" on public.courses for update
  using (instructor_id = my_instructor_id()) with check (instructor_id = my_instructor_id());

-- Sesiones (horarios públicos)
create policy "sesiones públicas" on public.live_sessions for select using (
  exists (select 1 from courses c where c.id = course_id
          and (c.status = 'published' or is_admin() or c.instructor_id = my_instructor_id()))
);
create policy "admin sesiones" on public.live_sessions for all using (is_admin()) with check (is_admin());

-- Acceso privado: solo inscritos, el instructor del curso o admin
create policy "acceso a sesión" on public.live_session_access for select using (
  exists (select 1 from live_sessions s join courses c on c.id = s.course_id
          where s.id = session_id
            and (is_enrolled(c.id) or c.instructor_id = my_instructor_id() or is_admin()))
);

-- Cupones: solo admin (la validación se hace en el servidor)
create policy "admin cupones" on public.coupons for all using (is_admin()) with check (is_admin());

-- Órdenes e inscripciones: el alumno ve las suyas; el instructor ve las de sus cursos
create policy "mis órdenes" on public.orders for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from courses c where c.id = course_id and c.instructor_id = my_instructor_id())
);
create policy "mis inscripciones" on public.enrollments for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from courses c where c.id = course_id and c.instructor_id = my_instructor_id())
);

-- Asistencia
create policy "mi asistencia" on public.attendance for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from live_sessions s join courses c on c.id = s.course_id
             where s.id = session_id and c.instructor_id = my_instructor_id())
);

-- Datos fiscales: solo el dueño
create policy "mis datos fiscales" on public.billing_profiles for all
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Facturas: el dueño de la orden o admin
create policy "mis facturas" on public.invoices for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Pagos a instructores
create policy "mis pagos de instructor" on public.instructor_payouts for select
  using (instructor_id = my_instructor_id() or is_admin());
