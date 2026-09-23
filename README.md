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

## Estado del desarrollo

| Fase | Estado |
|---|---|
| Base: proyecto, esquema, registro/login, roles | ✅ |
| Landing, catálogo y páginas de venta por curso, SEO | ✅ |
| Stripe (tarjeta, OXXO, MSI), cupones, acceso permanente | ✅ (probar con llaves) |
| CFDI con Facturama | ✅ (probar con cuenta sandbox) |
| Zoom: reuniones, "Entrar a la clase", asistencia | ✅ (probar con credenciales) |
| Grabaciones con expiración y acceso permanente | ✅ |
| Correos: confirmación de compra y recordatorios 24 h / 1 h | ✅ (necesita Resend) |
| Panel de alumno (cursos, clases, grabaciones, facturas, constancias) | ✅ |
| Panel de instructor (ventas, su comisión, lista de alumnos) | ✅ |
| Admin: cursos, sesiones, instructores, cupones, ventas, CSV | ✅ |
| Términos y aviso de privacidad | ✅ borrador (revisar con abogado) |

## Pendientes del dueño (Claude ya no puede avanzar sin esto)

1. **Supabase** — crear el proyecto y correr las migraciones (arriba). Pegar las 3 llaves en `web/.env.local`.
2. **Stripe** — cuenta y llaves de prueba (`sk_test_…`); activar OXXO y meses sin intereses en el dashboard; crear el webhook a `/api/stripe/webhook`.
3. **Facturama** — cuenta sandbox (apisandbox.facturama.mx), cargar CSD de pruebas, usuario y contraseña al `.env.local`. Confirmar con el contador la clave SAT de producto (`FACTURAMA_PRODUCT_CODE`).
4. **Zoom** — plan Pro + app Server-to-Server OAuth (marketplace.zoom.us) con scopes de reuniones y grabaciones; credenciales y webhook `recording.completed` → `/api/zoom/webhook`.
5. **Resend** — cuenta, verificar el dominio de correo y `RESEND_API_KEY`.
6. **Dominio y nombre real** de la plataforma (hoy dice "Cursos en Vivo").
7. **Contenido real**: instructores (nombre, tema, bio, comisión) y primeros cursos con fechas y precios — se capturan en `/admin`.
8. **Textos legales**: revisar los borradores de `/terminos` y `/privacidad` con un abogado; completar razón social y domicilio.
9. **Vercel** — cuenta para el deploy (`vercel.json` ya incluye el cron de recordatorios) y variable `CRON_SECRET`.
