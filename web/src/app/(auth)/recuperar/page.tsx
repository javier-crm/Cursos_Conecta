import Link from "next/link";
import { AuthCard } from "@/components/ui";
import { ResetRequestForm } from "../forms";

export const metadata = { title: "Recuperar contraseña" };

export default function Page() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle={<>Te enviaremos un enlace a tu correo. <Link href="/entrar" className="text-indigo-600 hover:underline">Volver</Link></>}
    >
      <ResetRequestForm />
    </AuthCard>
  );
}
