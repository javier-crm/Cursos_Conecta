import { AuthCard } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { NewPasswordForm } from "../forms";

export const metadata = { title: "Nueva contraseña" };

export default async function Page() {
  await requireUser("/nueva-contrasena");
  return (
    <AuthCard title="Elige una nueva contraseña">
      <NewPasswordForm />
    </AuthCard>
  );
}
