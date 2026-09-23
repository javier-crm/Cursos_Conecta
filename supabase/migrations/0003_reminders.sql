-- Control de recordatorios enviados (24 h y 1 h antes de cada sesión)
create table public.session_reminders (
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  kind        text not null check (kind in ('24h', '1h')),
  sent_at     timestamptz not null default now(),
  primary key (session_id, kind)
);

alter table public.session_reminders enable row level security;
-- Solo el servidor (service role) escribe y lee esta tabla.
