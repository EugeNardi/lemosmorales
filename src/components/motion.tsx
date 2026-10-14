"use client";

import { useEffect } from "react";

/** Progressive enhancement: all content is visible before JavaScript runs. */
export function MotionEnhancements() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    function connect() {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      if (preference.matches || !window.IntersectionObserver) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            const animation = entry.target.animate(
              [
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 550, easing: "cubic-bezier(.2,.65,.3,1)" },
            );
            animations.add(animation);
            animation.finished
              .then(() => animations.delete(animation))
              .catch(() => {});
          });
        },
        { threshold: 0.12 },
      );

      document
        .querySelectorAll(
          ".section-intro, .editorial-row, .about-copy, .about-body, .process-heading, .process-grid article, .support-grid > div, .property > div, .faq-list, .contact-copy, .contact-form",
        )
        .forEach((element) => observer?.observe(element));
    }

    connect();
    preference.addEventListener("change", connect);
    return () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", connect);
    };
  }, []);

  return null;
}
