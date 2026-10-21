# Procedencia y licencias

La landing incorpora `public/images/mesa-profesional.webp`, una escena ilustrativa generada con la herramienta integrada imagegen. Se identifica en la página como generada con IA; las personas no se presentan como integrantes reales de la empresa. Se optimizó a WebP, calidad 88, manteniendo su resolución de 1536 × 1024. No se descargan imágenes de terceros durante la visita.

Prompt utilizado: “Use case: photorealistic-natural. Asset type: landscape editorial photograph for an Argentine property administration company's institutional website. Primary request: a very sharp, realistic photograph of a working table shared by accountants or lawyers, conveying organized professional work. Scene: tasteful contemporary small office, walnut desk, cream walls, soft daylight through a window, muted deep green accents. Composition: landscape 3:2, close oblique view of the tabletop and hands of two professionals reviewing a small stack of accounting papers, an open notebook, calculator, pen and a laptop, relaxed natural work in progress. Faces outside the frame, no person posing, plausible hands and paperwork, no legible personal data or text, no company logos, no scales of justice or staged handshake, no watermark. Natural tactile materials and restrained warm colors, high clarity, editorial photographic realism, avoid generic glossy stock render.”

Fuentes locales distribuidas mediante Fontsource: [DM Serif Display](https://fontsource.org/fonts/dm-serif-display) y [Manrope](https://fontsource.org/fonts/manrope). Licencia SIL Open Font License 1.1; textos originales en `node_modules/@fontsource/<familia>/LICENSE`. Se usan subconjuntos latinos y `font-display: swap`. No hay conexiones a Google Fonts.

Las licencias de ambas fuentes también se conservan en `public/licenses/` para su redistribución con el sitio.

La firma tipográfica, favicon e imagen social son provisionales y propios de esta implementación. `public/social.png` tiene 1200 × 630 px y se puede regenerar con `node scripts/social-image.mjs`. Los íconos lineales se dibujaron con SVG propio.

## Referencias

Se consultó la página pública de [Vertex](https://dribbble.com/shots/27357269-Real-Estate-Website-Design-Vertex) y los índices públicos de [Mobbin inmobiliario](https://mobbin.com/explore/sites/categories/website-design-for-real-estate-agents) y [landing pages](https://mobbin.com/explore/sites/sections/landing-page). No se accedió a pantallas que requieren sesión. Séverra y Carrara no fueron accesibles con la herramienta de consulta; se siguió su descripción en el brief. No se copiaron sus assets ni composiciones.

Stack contrastado con la [instalación oficial de Next.js](https://nextjs.org/docs/app/getting-started/installation) y la [guía oficial de Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Versiones estables consultadas en npm al iniciar: Next 16.4.0, React 19.3.0 y Tailwind 4.3.3. `package-lock.json` fija el árbol instalado.
