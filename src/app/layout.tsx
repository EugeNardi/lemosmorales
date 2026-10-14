import type { Metadata } from "next";
import "@fontsource/dm-serif-display/latin-400.css";
import "@fontsource/dm-serif-display/latin-400-italic.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "./globals.css";
import { company } from "@/content/site";
const title = "Lemos Morales | Administración de consorcios";
const description =
  "Administración de consorcios con gestión profesional, herramientas tecnológicas y área legal integrada. Conocé Lemos Morales y solicitá una propuesta.";
export const metadata: Metadata = {
  title,
  description,
  ...(company.siteUrl
    ? { metadataBase: new URL(company.siteUrl), alternates: { canonical: "/" } }
    : {}),
  robots: {
    index: process.env.SITE_INDEXABLE === "true" && !!company.siteUrl,
    follow: process.env.SITE_INDEXABLE === "true" && !!company.siteUrl,
  },
  openGraph: {
    title,
    description,
    locale: "es_AR",
    type: "website",
    siteName: company.companyName,
    ...(company.siteUrl
      ? {
          url: company.siteUrl,
          images: [
            {
              url: `${company.siteUrl}/social.png`,
              width: 1200,
              height: 630,
              alt: "Lemos Morales — Una administración presente. Un consorcio tranquilo.",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    ...(company.siteUrl ? { images: [`${company.siteUrl}/social.png`] } : {}),
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
