import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/(auth)/actions";

export async function SiteHeader() {
  let user = null;
  if (supabaseConfigured) {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Cursos<span className="text-indigo-600"> en Vivo</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/cursos" className="text-slate-600 hover:text-slate-900">Cursos</Link>
          <Link href="/instructores" className="hidden text-slate-600 hover:text-slate-900 sm:inline">Conferencistas</Link>
          <Link href="/paquetes" className="hidden text-slate-600 hover:text-slate-900 md:inline">Paquetes</Link>
          {user ? (
            <>
              <Link href="/panel" className="text-slate-600 hover:text-slate-900">Mi panel</Link>
              <form action={signOut}>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar" className="text-slate-600 hover:text-slate-900">Entrar</Link>
              <Link href="/registro" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Cursos en Vivo</p>
        <nav className="flex gap-4">
          <Link href="/preguntas-frecuentes" className="hover:text-slate-700">Preguntas frecuentes</Link>
          <Link href="/terminos" className="hover:text-slate-700">Términos</Link>
          <Link href="/privacidad" className="hover:text-slate-700">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}
