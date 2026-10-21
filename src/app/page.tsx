import { Header } from "@/components/header";
import {
  Hero,
  Management,
  About,
  Process,
  Support,
  Property,
  Faq,
  Contact,
  Footer,
  WorkScene,
} from "@/components/sections";
import { mailConfigured } from "@/lib/mail";
import { company } from "@/content/site";
import { MotionEnhancements } from "@/components/motion";
import { storageConfigured } from "@/lib/crm/store";
import { WhatsAppFloat } from "@/components/whatsapp-float";
export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: company.companyName,
            ...(company.siteUrl ? { url: company.siteUrl } : {}),
            ...(company.contactEmail ? { email: company.contactEmail } : {}),
            ...(company.phoneE164 ? { telephone: company.phoneE164 } : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div id="inicio" />
      <Header />
      <MotionEnhancements />
      <main id="contenido">
        <Hero />
        <WorkScene />
        <Management />
        <About />
        <Process />
        <Support />
        <Property />
        <Faq />
        <Contact enabled={mailConfigured() || storageConfigured()} />
        <WhatsAppFloat />
      </main>
      <Footer />
    </>
  );
}
