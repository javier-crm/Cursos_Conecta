-- Reseñas y calificaciones de cursos (verificadas: solo alumnos inscritos)

create type review_status as enum ('pending', 'approved', 'rejected');

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  -- Nombre mostrado, congelado al momento de opinar (privacidad y simplicidad)
  author_name  text not null,
  status       review_status not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (user_id, course_id)
);
create index on public.reviews (course_id, status);

alter table public.reviews enable row level security;

-- Cualquiera puede leer reseñas aprobadas; el autor ve la suya; admin todo
create policy "reseñas aprobadas públicas" on public.reviews for select
  using (status = 'approved' or user_id = auth.uid() or is_admin());

-- Solo alumnos inscritos pueden opinar, una vez por curso
create policy "alumno inscrito opina" on public.reviews for insert
  with check (user_id = auth.uid() and is_enrolled(course_id));

-- El autor puede editar su reseña (vuelve a pendiente vía trigger); admin modera
create policy "autor edita su reseña" on public.reviews for update
  using (user_id = auth.uid() or is_admin());

create or replace function public.review_reset_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Si el autor (no admin) cambia contenido, vuelve a moderación
  if not is_admin() then
    new.status = 'pending';
  end if;
  return new;
end;
$$;

create trigger reviews_reset_status
  before update on public.reviews
  for each row execute function public.review_reset_status();

-- Permitir el recordatorio de reseña en la tabla de recordatorios
alter table public.session_reminders drop constraint session_reminders_kind_check;
alter table public.session_reminders add constraint session_reminders_kind_check
  check (kind in ('24h', '1h', 'review'));
