import Link from "next/link";
import { AuthCard, Alert } from "@/components/ui";
import { SignInForm } from "../forms";

export const metadata = { title: "Entrar" };

const LINK_ERRORS: Record<string, string> = {
  link: "El enlace expiró o ya fue usado. Intenta de nuevo.",
  google: "No pudimos conectar con Google. Intenta de nuevo.",
};

export default async function Page({ searchParams }: PageProps<"/entrar">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/panel";
  const errorMsg = typeof error === "string" ? LINK_ERRORS[error] : undefined;

  return (
    <AuthCard
      title="Entrar"
      subtitle={
        <>
          ¿No tienes cuenta?{" "}
          <Link href={`/registro?next=${encodeURIComponent(nextPath)}`} className="text-indigo-600 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      {errorMsg && <div className="mb-4"><Alert kind="error">{errorMsg}</Alert></div>}
      <SignInForm next={nextPath} />
    </AuthCard>
  );
}
