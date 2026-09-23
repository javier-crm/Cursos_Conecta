-- Perfil público de conferencistas: credenciales y fotos

alter table public.instructors
  add column if not exists headline text,      -- p.ej. "Directora comercial · 15 años en ventas B2B"
  add column if not exists credentials text;   -- logros/certificaciones, un punto por línea

-- Bucket público para fotos de instructores (lectura pública, escritura solo servidor)
insert into storage.buckets (id, name, public)
values ('instructores', 'instructores', true)
on conflict (id) do nothing;

create policy "fotos instructores públicas"
  on storage.objects for select using (bucket_id = 'instructores');
