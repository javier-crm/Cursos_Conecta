-- Avisos por WhatsApp/correo a los inscritos de un curso

create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  body        text not null,
  link_url    text,
  sent_email  integer not null default 0,
  sent_wa     integer not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.announcements (course_id);

alter table public.announcements enable row level security;
create policy "avisos visibles a su curso" on public.announcements for select using (
  is_admin()
  or exists (select 1 from courses c where c.id = course_id and c.instructor_id = my_instructor_id())
  or is_enrolled(course_id)
);

-- Recordatorio de 30 minutos antes (correo + WhatsApp)
alter table public.session_reminders drop constraint session_reminders_kind_check;
alter table public.session_reminders add constraint session_reminders_kind_check
  check (kind in ('24h', '1h', '30m', 'review'));
