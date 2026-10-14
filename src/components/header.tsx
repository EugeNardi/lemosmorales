"use client";
import { useRef, useState } from "react";
import { navigation, company } from "@/content/site";
import { Brand, Arrow } from "./brand";
export function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  function close() {
    setOpen(false);
    toggle.current?.focus();
  }
  return (
    <header
      className="header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) close();
      }}
    >
      <div className="container header-inner">
        <Brand />
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? "Cerrar" : "Menú"}
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
        <nav
          ref={nav}
          id="navigation"
          aria-label="Principal"
          className={open ? "navigation is-open" : "navigation"}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
            if (event.key === "Tab" && open) {
              const links = nav.current?.querySelectorAll("a");
              if (
                links &&
                event.target === links[links.length - 1] &&
                !event.shiftKey
              ) {
                event.preventDefault();
                toggle.current?.focus();
              }
            }
          }}
        >
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          {company.clientPortalUrl && (
            <a href={company.clientPortalUrl}>Acceso a clientes</a>
          )}
          <a
            href="#contacto"
            className="button header-cta"
            onClick={() => setOpen(false)}
          >
            Solicitar una propuesta <Arrow diagonal />
          </a>
        </nav>
      </div>
    </header>
  );
}
