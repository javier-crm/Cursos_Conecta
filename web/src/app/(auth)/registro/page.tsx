import Link from "next/link";
import { AuthCard } from "@/components/ui";
import { SignUpForm } from "../forms";

export const metadata = { title: "Crear cuenta" };

export default async function Page({ searchParams }: PageProps<"/registro">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/panel";

  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href={`/entrar?next=${encodeURIComponent(nextPath)}`} className="text-indigo-600 hover:underline">
            Entra aquí
          </Link>
        </>
      }
    >
      <SignUpForm next={nextPath} />
    </AuthCard>
  );
}
