import Link from "next/link";
import { requireAdmin } from "@/lib/crm/auth";
import { listInquiries, statuses, type Status } from "@/lib/crm/store";
import { logout } from "./actions";
const labels: Record<Status, string> = {
  new: "Nueva",
  contacted: "En seguimiento",
  closed: "Cerrada",
};
export default async function Inbox({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.slice(0, 200) : "";
  const status = typeof query.status === "string" ? query.status : "";
  const page = Math.max(1, Math.min(Number(query.page) || 1, 100000));
  const data = await listInquiries({ search, status, page });
  function pageLink(value: number) {
    const params = new URLSearchParams({
      q: search,
      status,
      page: String(value),
    });
    return `/consultas?${params}`;
  }
  return (
    <>
      <div className="crm-title-row">
        <div>
          <p className="eyebrow">Tu espacio de gestión</p>
          <h1>Consultas recibidas.</h1>
          <p>Cada mensaje, un próximo paso.</p>
        </div>
        <form action={logout}>
          <button className="crm-quiet-button">Cerrar sesión ↗</button>
        </form>
      </div>
      <div className="crm-stats">
        {statuses.map((item) => (
          <Link key={item} href={`/consultas?status=${item}`}>
            <span>{labels[item]}</span>
            <strong>
              {Number(
                data.counts.find((row) => row.status === item)?.total || 0,
              )}
            </strong>
          </Link>
        ))}
      </div>
      <form className="crm-filters" method="get">
        <div>
          <label htmlFor="search">Buscar consultas</label>
          <input
            id="search"
            name="q"
            defaultValue={search}
            maxLength={200}
            placeholder="Nombre, email, consorcio o mensaje"
          />
        </div>
        <div>
          <label htmlFor="filter-status">Estado</label>
          <select id="filter-status" name="status" defaultValue={status}>
            <option value="">Todos los estados</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
        </div>
        <button className="button">
          Filtrar <span aria-hidden="true">↗</span>
        </button>
        {(search || status) && (
          <Link href="/consultas" className="text-link">
            Limpiar
          </Link>
        )}
      </form>
      <section className="crm-inbox" aria-label="Bandeja de consultas">
        <div className="crm-list-header">
          <h2>Tu bandeja</h2>
          <span>
            {data.total} {data.total === 1 ? "consulta" : "consultas"}
          </span>
        </div>
        {!data.rows.length ? (
          <div className="crm-empty">
            <span aria-hidden="true">↗</span>
            <h3>
              {search || status
                ? "No encontramos consultas con esos filtros."
                : "Todo listo para la primera conversación."}
            </h3>
            <p>
              {search || status
                ? "Probá con otro nombre o estado."
                : "Las consultas enviadas desde el formulario aparecerán acá."}
            </p>
          </div>
        ) : (
          data.rows.map((item) => (
            <Link
              href={`/consultas/${item.id}`}
              className="crm-inquiry"
              key={item.id}
            >
              <div>
                <span className={`crm-badge ${item.status}`}>
                  {labels[item.status]}
                </span>
                <h3>{item.name}</h3>
                <p>{item.building || item.email}</p>
              </div>
              <div className="crm-inquiry-summary">
                <span>{item.reason}</span>
                <p>
                  {item.message.slice(0, 160)}
                  {item.message.length > 160 ? "…" : ""}
                </p>
              </div>
              <div className="crm-inquiry-date">
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleDateString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                    day: "2-digit",
                    month: "short",
                  })}
                </time>
                <span aria-hidden="true">↗</span>
              </div>
            </Link>
          ))
        )}
      </section>
      <nav className="crm-pagination" aria-label="Páginas de consultas">
        {page > 1 && (
          <Link className="text-link" href={pageLink(page - 1)}>
            ← Anterior
          </Link>
        )}
        <span>Página {page}</span>
        {data.total > page * 20 && (
          <Link className="text-link" href={pageLink(page + 1)}>
            Siguiente →
          </Link>
        )}
      </nav>
    </>
  );
}
