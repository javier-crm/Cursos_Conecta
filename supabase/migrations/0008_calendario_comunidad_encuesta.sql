-- Calendario, comunidad por curso y encuesta post-clase

-- Grupo de WhatsApp/Discord del curso (el alumno recibe la liga al inscribirse)
alter table public.courses add column community_url text;

-- Encuesta privada por sesión (feedback para el instructor, no público)
create table public.session_feedback (
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_feedback enable row level security;

create policy "alumno responde encuesta" on public.session_feedback for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from live_sessions s where s.id = session_id and is_enrolled(s.course_id))
  );

create policy "leer encuesta" on public.session_feedback for select using (
  user_id = auth.uid()
  or is_admin()
  or exists (
    select 1 from live_sessions s join courses c on c.id = s.course_id
    where s.id = session_id and c.instructor_id = my_instructor_id()
  )
);
