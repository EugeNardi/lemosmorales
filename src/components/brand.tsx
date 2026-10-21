import { company } from "@/content/site";
import Link from "next/link";
export function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.4 11.7a8.4 8.4 0 0 1-12.3 7.5L3 20.5l1.4-4.9a8.4 8.4 0 1 1 16-3.9Z" />
      <path d="M8.1 7.5c.3-.3.7-.2.9.2l.9 1.8c.1.3.1.5-.1.7l-.6.7c.8 1.5 1.9 2.6 3.5 3.3l.7-.8c.2-.3.5-.3.8-.1l1.8.8c.4.2.5.5.3.9-.5 1.2-1.5 1.5-2.6 1.1-3.6-1.2-5.8-3.5-6.8-6.3-.4-1-.2-1.7.4-2.3Z" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link
      href="/#inicio"
      className="brand"
      aria-label={`${company.companyName}, inicio`}
    >
      <span>
        {company.companyName}
        <span className="brand-dot">.</span>
      </span>
      <small>Administración de consorcios</small>
    </Link>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}
