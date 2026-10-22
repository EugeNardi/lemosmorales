import { redirect } from "next/navigation";
import { authenticated } from "@/lib/crm/auth";
import { authConfigured } from "@/lib/crm/security";
import { storageConfigured } from "@/lib/crm/store";
import { LoginForm } from "@/components/crm/login-form";
export default async function LoginPage() {
  if (await authenticated()) redirect("/consultas");
  return (
    <div className="crm-login">
      <div>
        <p className="eyebrow">Área privada / Lemos Morales</p>
        <h1>
          Una conversación.
          <br />
          <em>El comienzo de una gestión.</em>
        </h1>
        <p>
          Tu espacio para recibir consultas, registrar el seguimiento y
          acompañar cada oportunidad.
        </p>
        <span className="crm-login-rule" aria-hidden="true" />
      </div>
      <section className="crm-login-card" aria-labelledby="access-title">
        <p className="eyebrow">CRM / Acceso al equipo</p>
        <h2 id="access-title">Bienvenido.</h2>
        <p>Ingresá para ver las consultas del sitio.</p>
        <LoginForm enabled={authConfigured() && storageConfigured()} />
      </section>
    </div>
  );
}
