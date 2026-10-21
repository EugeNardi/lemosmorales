"use client";
import { useActionState, useState } from "react";
import { login } from "@/app/crm/actions";
export function LoginForm({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState("");
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="crm-login-form">
      <label htmlFor="crm-email">Correo de acceso</label>
      <input
        id="crm-email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        autoComplete="username"
        required
        maxLength={254}
      />
      <label htmlFor="crm-password">Contraseña</label>
      <input
        id="crm-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
      />
      {!enabled && (
        <p className="preview-notice">
          El acceso privado todavía no está habilitado en este entorno.
        </p>
      )}
      <p role="status" className="error">
        {state.error}
      </p>
      <button className="button" disabled={pending || !enabled}>
        {pending ? "Ingresando…" : "Ingresar al CRM"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
