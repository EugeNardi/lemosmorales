import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import "./crm.css";
export const metadata: Metadata = {
  title: "Gestión de consultas | Lemos Morales",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: { title: "Acceso privado | Lemos Morales" },
};
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm-shell">
      <header className="crm-header">
        <Brand />
        <Link href="/">
          Volver al sitio <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main id="contenido" className="crm-main">
        {children}
      </main>
      <footer className="crm-footer">
        Lemos Morales · Gestión de consultas · Acceso privado
      </footer>
    </div>
  );
}
