import { company } from "@/content/site";
export function Brand() {
  return (
    <a
      href="#inicio"
      className="brand"
      aria-label={`${company.companyName}, inicio`}
    >
      <span>
        {company.companyName}
        <span className="brand-dot">.</span>
      </span>
      <small>Administración de consorcios</small>
    </a>
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
