# Procedencia y licencias

La landing no usa fotografías. Se retiraron las dos fotos residenciales y sus archivos locales a pedido del usuario. Los marcos y detalles decorativos se construyen con CSS; no se descargan imágenes de terceros durante la visita.

Fuentes locales distribuidas mediante Fontsource: [DM Serif Display](https://fontsource.org/fonts/dm-serif-display) y [Manrope](https://fontsource.org/fonts/manrope). Licencia SIL Open Font License 1.1; textos originales en `node_modules/@fontsource/<familia>/LICENSE`. Se usan subconjuntos latinos y `font-display: swap`. No hay conexiones a Google Fonts.

Las licencias de ambas fuentes también se conservan en `public/licenses/` para su redistribución con el sitio.

La firma tipográfica, favicon e imagen social son provisionales y propios de esta implementación. `public/social.png` tiene 1200 × 630 px y se puede regenerar con `node scripts/social-image.mjs`. Los íconos lineales se dibujaron con SVG propio.

## Referencias

Se consultó la página pública de [Vertex](https://dribbble.com/shots/27357269-Real-Estate-Website-Design-Vertex) y los índices públicos de [Mobbin inmobiliario](https://mobbin.com/explore/sites/categories/website-design-for-real-estate-agents) y [landing pages](https://mobbin.com/explore/sites/sections/landing-page). No se accedió a pantallas que requieren sesión. Séverra y Carrara no fueron accesibles con la herramienta de consulta; se siguió su descripción en el brief. No se copiaron sus assets ni composiciones.

Stack contrastado con la [instalación oficial de Next.js](https://nextjs.org/docs/app/getting-started/installation) y la [guía oficial de Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Versiones estables consultadas en npm al iniciar: Next 16.4.0, React 19.3.0 y Tailwind 4.3.3. `package-lock.json` fija el árbol instalado.
