"use client";
import { useEffect, useRef, useState } from "react";
import {
  validate,
  reasons,
  limits,
  type ContactData,
  type Errors,
} from "@/lib/validation";
import { Arrow } from "./brand";
export function PropertyLink() {
  return (
    <a
      className="text-link"
      href="#contacto"
      onClick={() => window.dispatchEvent(new Event("property-inquiry"))}
    >
      Consultar por servicios inmobiliarios <Arrow diagonal />
    </a>
  );
}
export function ContactForm({ enabled }: { enabled: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const started = useRef(0);
  const lock = useRef(false);
  const [reason, setReason] = useState<string>(reasons[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    started.current = Date.now();
    const select = () => setReason(reasons[1]);
    window.addEventListener("property-inquiry", select);
    return () => window.removeEventListener("property-inquiry", select);
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const checked = validate({ ...values, reason, startedAt: started.current });
    setErrors(checked.errors);
    setStatus("");
    setSuccess(false);
    if (!checked.data) {
      const key = Object.keys(checked.errors)[0];
      form.current?.querySelector<HTMLElement>(`[name="${key}"]`)?.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.data),
      });
      const result = await response.json();
      setStatus(result.message);
      if (result.errors) setErrors(result.errors);
      if (response.ok) {
        setSuccess(true);
        form.current?.reset();
        setReason(reasons[0]);
        started.current = Date.now();
      }
    } catch {
      setStatus("No pudimos conectar. Revisá tu conexión y volvé a intentar.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const field = (
    name: keyof Pick<ContactData, "name" | "email" | "phone" | "building">,
    label: string,
    type = "text",
    optional = false,
  ) => (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {optional && <span> (opcional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={!optional}
        autoComplete={
          { name: "name", email: "email", phone: "tel", building: "off" }[name]
        }
        maxLength={limits[name]}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <small className="error" id={`${name}-error`}>
          {errors[name]}
        </small>
      )}
    </div>
  );
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      className="contact-form"
      aria-label="Consulta comercial"
    >
      <p className="form-intro">
        Empecemos una conversación <span aria-hidden="true">↗</span>
      </p>
      {!enabled && (
        <p className="preview-notice">
          Vista previa: el envío de consultas todavía no está habilitado.
        </p>
      )}
      <div className="form-grid">
        {field("name", "Nombre y apellido")}
        {field("email", "Email", "email")}
        {field("phone", "Teléfono", "tel", true)}
        {field("building", "Consorcio y localidad", "text", true)}
        <div className="field full">
          <label htmlFor="reason">Motivo de la consulta</label>
          <select
            name="reason"
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {reasons.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          {errors.reason && <small className="error">{errors.reason}</small>}
        </div>
        <div className="field full">
          <label htmlFor="message">Mensaje</label>
          <textarea
            name="message"
            id="message"
            rows={4}
            required
            maxLength={limits.message}
            placeholder="Contanos brevemente qué necesita tu edificio…"
            aria-invalid={!!errors.message}
            aria-describedby="message-help message-error"
          />
          <small id="message-help">
            Hasta 4.000 caracteres. No incluyas información sensible.
          </small>
          {errors.message && (
            <small id="message-error" className="error">
              {errors.message}
            </small>
          )}
        </div>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          maxLength={200}
        />
      </div>
      <div className="form-bottom">
        <small>
          Los campos sin “opcional” son obligatorios.
          <br />
          Usaremos tus datos para responder esta consulta.
        </small>
        <button className="button" disabled={busy} type="submit">
          {busy ? "Enviando…" : "Enviar consulta"}
          <Arrow diagonal />
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={success ? "form-status success" : "form-status"}
      >
        {status}
      </p>
    </form>
  );
}
