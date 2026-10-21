import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/crm/auth";
import { getInquiry, statuses, type Status } from "@/lib/crm/store";
import { editInquiry, deleteInquiry } from "../actions";
const labels: Record<Status, string> = {
  new: "Nueva",
  contacted: "En seguimiento",
  closed: "Cerrada",
};
export default async function InquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) notFound();
  const item = await getInquiry(id);
  if (!item) notFound();
  const { saved } = await searchParams;
  return (
    <>
      <Link className="text-link" href="/crm">
        ← Volver a la bandeja
      </Link>
      <div className="crm-title-row">
        <div>
          <p className="eyebrow">Consulta / {item.reason}</p>
          <h1>{item.name}</h1>
          <p>
            Recibida el{" "}
            {new Date(item.created_at).toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </p>
        </div>
        <span className={`crm-badge ${item.status}`}>
          {labels[item.status]}
        </span>
      </div>
      {saved === "1" && (
        <p className="crm-saved" role="status">
          Seguimiento guardado.
        </p>
      )}
      <div className="crm-detail-grid">
        <article className="crm-panel">
          <h2>La conversación empieza acá.</h2>
          <dl className="crm-contact-data">
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${item.email}`}>{item.email}</a>
              </dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{item.phone || "No indicado"}</dd>
            </div>
            <div>
              <dt>Consorcio y localidad</dt>
              <dd>{item.building || "No indicado"}</dd>
            </div>
          </dl>
          <h3>Mensaje recibido</h3>
          <p className="crm-message">{item.message}</p>
          <a
            className="button"
            href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.reason} · Lemos Morales`)}`}
          >
            Responder por email ↗
          </a>
          <p className="crm-mail-note">
            Notificación al correo:{" "}
            {item.notification === "sent"
              ? "aceptada por el proveedor"
              : item.notification === "failed"
                ? "no enviada; la consulta está guardada"
                : "sin configurar"}
            . Responder abre tu aplicación de correo.
          </p>
        </article>
        <aside>
          <form className="crm-panel crm-followup" action={editInquiry}>
            <h2>Próximo paso.</h2>
            <input type="hidden" name="id" value={item.id} />
            <label htmlFor="inquiry-status">Estado de la consulta</label>
            <select
              id="inquiry-status"
              name="status"
              defaultValue={item.status}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {labels[status]}
                </option>
              ))}
            </select>
            <label htmlFor="notes">Notas internas</label>
            <textarea
              id="notes"
              name="notes"
              rows={7}
              maxLength={5000}
              defaultValue={item.notes}
              placeholder="Anotá lo conversado y el próximo paso…"
            />
            <small>Solo son visibles en el CRM. Hasta 5.000 caracteres.</small>
            <button className="button">Guardar seguimiento ↗</button>
          </form>
          <details className="crm-delete">
            <summary>Eliminar esta consulta</summary>
            <form action={deleteInquiry}>
              <input type="hidden" name="id" value={item.id} />
              <p>
                Se eliminarán el mensaje, los datos de contacto y sus notas.
              </p>
              <label>
                <input type="checkbox" name="confirm" value="yes" required />{" "}
                Confirmo que quiero eliminarla
              </label>
              <button className="crm-delete-button">
                Eliminar definitivamente
              </button>
            </form>
          </details>
        </aside>
      </div>
    </>
  );
}
