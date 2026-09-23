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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-600/30">
            C
          </span>
          Cursos<span className="text-gradient"> en Vivo</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/cursos" className="text-slate-600 transition hover:text-indigo-700">Cursos</Link>
          <Link href="/instructores" className="hidden text-slate-600 transition hover:text-indigo-700 sm:inline">Conferencistas</Link>
          <Link href="/paquetes" className="hidden text-slate-600 transition hover:text-indigo-700 md:inline">Paquetes</Link>
          {user ? (
            <>
              <Link href="/panel" className="text-slate-600 transition hover:text-indigo-700">Mi panel</Link>
              <form action={signOut}>
                <button className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar" className="text-slate-600 transition hover:text-indigo-700">Entrar</Link>
              <Link href="/registro" className="btn-primary px-4 py-2 text-sm">
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
    <footer className="mt-auto bg-slate-950 text-slate-400">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black">
                C
              </span>
              Cursos en Vivo
            </p>
            <p className="mt-1 text-sm">Aprende en vivo con expertos, sin rodeos.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/cursos" className="transition hover:text-white">Cursos</Link>
            <Link href="/instructores" className="transition hover:text-white">Conferencistas</Link>
            <Link href="/preguntas-frecuentes" className="transition hover:text-white">Preguntas frecuentes</Link>
            <Link href="/terminos" className="transition hover:text-white">Términos</Link>
            <Link href="/privacidad" className="transition hover:text-white">Privacidad</Link>
          </nav>
        </div>
        <p className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Cursos en Vivo · Monterrey, México
        </p>
      </div>
    </footer>
  );
}
