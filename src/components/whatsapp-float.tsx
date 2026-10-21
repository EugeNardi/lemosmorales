"use client";
import { useEffect, useState } from "react";
import { company } from "@/content/site";
import { whatsappUrl } from "@/lib/contact-links";
import { WhatsAppIcon } from "./brand";
export function WhatsAppFloat() {
  const [hidden, setHidden] = useState(false);
  const href = whatsappUrl(company.whatsappNumber);
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visible.add(entry.target)
          : visible.delete(entry.target),
      );
      setHidden(visible.size > 0);
    });
    document
      .querySelectorAll("#contacto,.footer")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  if (!href) return null;
  return (
    <a
      className="whatsapp-float"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir WhatsApp para consultar por tu consorcio"
      hidden={hidden}
    >
      <span className="whatsapp-float-label">¿Hablamos?</span>
      <span className="whatsapp-float-icon">
        <WhatsAppIcon />
      </span>
    </a>
  );
}
