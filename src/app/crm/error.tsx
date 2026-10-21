"use client";
export default function CrmError({ reset }: { reset: () => void }) {
  return (
    <section className="crm-panel">
      <p className="eyebrow">Gestión de consultas</p>
      <h1>No pudimos cargar la bandeja.</h1>
      <p>
        La información no está disponible en este momento. Volvé a intentar.
      </p>
      <button className="button" onClick={reset}>
        Reintentar ↗
      </button>
    </section>
  );
}
