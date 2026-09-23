// Mientras no existan las llaves de Supabase (.env.local), el sitio corre en
// modo demo: la landing funciona y las secciones con datos muestran un aviso.
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
