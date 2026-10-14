import { content, company, navigation } from "@/content/site";
import { Arrow, Brand } from "./brand";
import { ContactForm, PropertyLink } from "./contact-form";
export function Hero() {
  return (
    <section className="hero container" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="tiny-line" />
          {content.hero.eyebrow}
        </p>
        <h1 id="hero-title">
          {content.hero.title}
          <em>{content.hero.emphasis}</em>
        </h1>
        <p className="hero-description">{content.hero.description}</p>
        <div className="hero-actions">
          <a className="button" href="#contacto">
            Solicitar una propuesta <Arrow diagonal />
          </a>
          <a className="text-link" href="#como-trabajamos">
            Conocé cómo trabajamos <Arrow />
          </a>
        </div>
        <p className="hero-values">
          Transparencia <span>·</span> Seguimiento <span>·</span>{" "}
          Responsabilidad
        </p>
      </div>
      <div className="hero-foot">
        <span>La tranquilidad de una gestión presente.</span>
        <a href="#gestion" aria-label="Explorar nuestra gestión">
          Descubrí nuestra forma de trabajar <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
export function Management() {
  return (
    <section id="gestion" className="section container management">
      <div className="section-intro">
        <p className="eyebrow">01 / Nuestra forma de gestionar</p>
        <h2>{content.management.title}</h2>
        <p>{content.management.description}</p>
        <a className="text-link" href="#contacto">
          Conversemos sobre tu consorcio <Arrow diagonal />
        </a>
      </div>
      <div className="editorial-rows">
        {content.management.items.map(([title, description], i) => (
          <article key={title} className="editorial-row">
            <span className="number">0{i + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <span className="row-cross" aria-hidden="true">
              ↗
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
export function About() {
  return (
    <section id="nosotros" className="about">
      <div className="container about-grid">
        <div className="about-copy">
          <p className="eyebrow">02 / Lemos Morales</p>
          <h2>{content.about.title}</h2>
          <span className="about-signature" aria-hidden="true">
            Lemos Morales.
          </span>
        </div>
        <div className="about-body">
          {content.about.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="premise">
            <span>Nuestra premisa</span>
            <p>{content.about.premise}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
export function Process() {
  return (
    <section id="como-trabajamos" className="section container process">
      <div className="process-heading">
        <p className="eyebrow">03 / Cómo trabajamos</p>
        <h2>{content.process.title}</h2>
        <p>
          Una manera de trabajar clara.
          <br />
          Un compromiso en cada etapa.
        </p>
      </div>
      <div className="process-grid">
        {content.process.steps.map(([title, description], i) => (
          <article key={title}>
            <div className="step-top">
              <span>0{i + 1}</span>
              <Arrow />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Support() {
  return (
    <section className="support">
      <div className="container support-grid">
        <div>
          <p className="eyebrow">Tecnología + respaldo legal</p>
          <h2>{content.support.title}</h2>
        </div>
        <div className="support-copy">
          <div className="support-symbol" aria-hidden="true">
            <span>+</span>
            <span>+</span>
          </div>
          <p>{content.support.description}</p>
          <a href="#contacto" className="text-link">
            Conocé nuestra propuesta <Arrow diagonal />
          </a>
        </div>
      </div>
    </section>
  );
}
export function Property() {
  return (
    <section className="container property">
      <p className="eyebrow">También, gestión de propiedades</p>
      <div>
        <h2>{content.property.title}</h2>
        <p>{content.property.description}</p>
        <PropertyLink />
      </div>
    </section>
  );
}
export function Faq() {
  return (
    <section className="container section faq">
      <div>
        <p className="eyebrow">Antes de conversar</p>
        <h2>
          Algunas respuestas
          <br />
          para empezar.
        </h2>
      </div>
      <div className="faq-list">
        {content.faq.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function Contact({ enabled }: { enabled: boolean }) {
  return (
    <section id="contacto" className="contact">
      <div className="container contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">04 / Demos el primer paso</p>
          <h2>{content.contact.title}</h2>
          <p>{content.contact.description}</p>
          <div className="contact-mark" aria-hidden="true">
            Hablemos<span>↗</span>
          </div>
          {company.contactEmail && (
            <a className="text-link" href={`mailto:${company.contactEmail}`}>
              {company.contactEmail}
            </a>
          )}
          {company.phoneE164 && (
            <a className="text-link" href={`tel:${company.phoneE164}`}>
              {company.phoneDisplay || company.phoneE164}
            </a>
          )}
          {company.whatsappNumber && (
            <a
              className="text-link"
              href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hola, quisiera consultar por la administración de un consorcio.")}`}
            >
              Escribinos por WhatsApp
            </a>
          )}
          {company.address && <p>{company.address}</p>}
          {company.serviceArea && <p>{company.serviceArea}</p>}
        </div>
        <ContactForm enabled={enabled} />
      </div>
    </section>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <Brand />
          <p>
            Presencia en la gestión.
            <br />
            Tranquilidad en tu consorcio.
          </p>
          <nav aria-label="Pie de página">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            {company.socialLinks.map((item) => (
              <a key={item.url} href={item.url}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {company.companyName}. Todos los
            derechos reservados.
          </span>
          <a href="#inicio">Volver al inicio ↑</a>
        </div>
      </div>
    </footer>
  );
}
