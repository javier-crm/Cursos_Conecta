# Plataforma de cursos en vivo

Cursos de pago único con 2 sesiones en vivo de 1 hora, grabación disponible 72 horas,
3–4 instructores con comisión, pagos con Stripe y facturación CFDI.

## Estructura

- `web/` — aplicación Next.js 16 (App Router, Tailwind 4, Supabase)
- `supabase/migrations/` — esquema de base de datos (correr en orden en el SQL Editor de Supabase)
- `supabase/seed.sql` — datos de ejemplo para desarrollo

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) (región `us-east-1` va bien para México).
2. En el **SQL Editor**, ejecuta `supabase/migrations/0001_init.sql` y luego `supabase/seed.sql`.
3. En **Authentication → Providers** activa Email y (opcional) Google.
4. En **Authentication → URL Configuration** agrega `http://localhost:3000/auth/callback` a las Redirect URLs.
5. Copia `web/.env.example` a `web/.env.local` y llena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
6. Corre la app:

```bash
cd web && npm install && npm run dev
```

## Roles

Todos los registros entran como `student`. Para volver a alguien admin, en el SQL Editor:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tucorreo@ejemplo.com');
```

Para ligar a un instructor con su cuenta: `update public.instructors set profile_id = '<uuid del usuario>' where slug = '...'` y ponerle `role = 'instructor'` en `profiles`.

## Plan de trabajo (resumen)

| Semanas | Fase |
|---|---|
| 1–2 | ✅ Base: proyecto, esquema, registro/login, roles, landing inicial |
| 3 | Landing definitiva y páginas de venta por curso |
| 4–5 | Stripe (tarjeta, OXXO, MSI), cupones, CFDI con Facturapi |
| 5–6 | Zoom: sesiones en vivo, recordatorios, asistencia |
| 6–7 | Grabaciones con expiración a 72 h y venta de acceso permanente |
| 7–8 | Paneles de alumno, instructor y admin; reporte de pagos a instructores |
| 8–9 | Pruebas, textos legales y lanzamiento |
