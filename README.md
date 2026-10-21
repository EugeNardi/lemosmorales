# Lemos Morales

Landing institucional y CRM privado para administración de consorcios. Next.js App Router, TypeScript, Tailwind CSS, fuentes locales y SMTP con Nodemailer. El CRM recibe consultas, permite buscarlas, gestionar estados y registrar notas. SQLite local y PostgreSQL en Vercel. No incluye rastreadores. Ver [CRM.md](CRM.md) para la configuración del acceso y almacenamiento.

## Ejecutar

Requiere Node.js 24.x (verificado con 24.13.0) y npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

En PowerShell, usar `Copy-Item .env.example .env.local`. Abrir http://127.0.0.1:3000.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## Contenidos y marca

Editar `src/content/site.ts`: textos institucionales y configuración pública tipada. Los datos desconocidos son `null` o listas vacías. Los contactos, redes y acceso de clientes se muestran únicamente cuando se completan. Teléfono internacional en `phoneE164`; WhatsApp en `whatsappNumber` con código de país y solo dígitos.

La marca es una firma tipográfica provisional reemplazable en `src/components/brand.tsx`. La paleta y los estilos están en `src/app/globals.css`. [ASSETS.md](ASSETS.md) registra imágenes, fuentes, licencias y límites de acceso a referencias.

## Contacto

Copiar `.env.example` a `.env.local` y completar `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_FROM` y `CONTACT_TO`. Ninguna credencial debe llevar el prefijo `NEXT_PUBLIC_`. En producción, cargar estos valores como secretos del servidor. `CONTACT_FROM` debe pertenecer a un remitente autorizado por el proveedor. El visitante es `replyTo`; el destinatario se toma exclusivamente de la configuración del servidor.

Con el CRM configurado, el formulario guarda primero la consulta en la base de datos: solo responde 200 una vez guardada. Si SMTP también está configurado, envía una notificación y registra su estado en el CRM. Si falla el email, el mensaje permanece guardado y no se pide volver a enviarlo. Sin CRM se conserva el modo SMTP directo, con éxito únicamente cuando el proveedor acepta el correo. Sin ninguno de los dos canales, se muestra el aviso de envío deshabilitado y se devuelve 503. No se registran mensajes en logs ni se guardan en el navegador.

Cliente y servidor validan campos y límites. El endpoint acepta un máximo de 14 KB, email de hasta 254 caracteres y mensaje de hasta 4000. Incluye honeypot, tiempo mínimo de dos segundos, control de origen y bloqueo de doble envío en cliente. El correo usa texto plano, por lo que no interpreta HTML del visitante.

El límite de contacto es de cinco intentos cada diez minutos. Con CRM, los contadores se guardan en la base y se comparten entre Functions; sin CRM son locales a cada proceso. El acceso privado admite ocho intentos cada quince minutos. `TRUST_PROXY=false` usa un límite global conservador; activar `true` solo detrás de un proxy que sobrescriba y sanee `X-Forwarded-For`. Se guardan hashes temporales, no IP en claro. En modo SMTP sin CRM y con múltiples instancias, agregar un límite en el firewall.

`npm test` levanta un servidor SMTP efímero en loopback y usa dominios `.test`: prueba aceptación y rechazo, incluido el endpoint, sin enviar correos reales. No existe un modo de éxito ficticio en la landing. Para verificar el canal real, configurar el proveedor y autorizar por separado una consulta de prueba, comprobando recepción, Reply-To, SPF/DKIM y carpeta de spam.

## Publicar cuando esté aprobado

1. Confirmar datos públicos en `src/content/site.ts`, cobertura y firma de marca.
2. Configurar SMTP, remitente y destinatario; verificar recepción con autorización.
3. Establecer `NEXT_PUBLIC_SITE_URL` con el origen HTTPS real, sin barra final. No hay dominio de ejemplo en producción.
4. Mantener `SITE_INDEXABLE=false` para cualquier vista previa. Solo al publicar la versión definitiva, cambiarlo a `true`; canonical, imagen social absoluta y sitemap se generan con el dominio configurado. Sin dominio, no hay canonical ni URLs sociales inventadas.
5. Ejecutar comprobaciones, generar `npm run build` y desplegar en un entorno Node que permita conexiones SMTP. No usar exportación estática: el endpoint requiere servidor. Configurar HTTPS y rate limit del proxy según el entorno anterior.
6. Reiniciar y reconstruir después de cambiar dominio o indexación; volver a verificar formulario y metadatos.

Esta versión puede publicarse para revisión. La recepción online en el CRM requiere conectar PostgreSQL; las notificaciones por correo requieren además configurar SMTP.

### Vercel desde GitHub

El repositorio está preparado para importarse desde `EugeNardi/lemosmorales`. En [Vercel New Project](https://vercel.com/new), elegir ese repositorio, mantener la carpeta raíz y el preset **Next.js**. `vercel.json` fija instalación con `npm ci` y build con `npm run build`; Node está fijado a 24.x. Dejar **Output Directory** sin sobrescribir: Vercel administra tanto la página como el endpoint de Next.js.

Para la primera revisión no se requieren credenciales SMTP ni variables de entorno: se verá el aviso de envío deshabilitado y se mantendrá `noindex`. Después del primer despliegue, usar la URL asignada por Vercel en `NEXT_PUBLIC_SITE_URL` y volver a desplegar. Mantener `SITE_INDEXABLE=false` hasta aprobar la publicación definitiva.

Para habilitar el CRM, cargar `DATABASE_URL`, `CRM_ADMIN_EMAIL`, `CRM_PASSWORD_HASH` y `CRM_SESSION_SECRET` en las variables del servidor de Vercel. Para recibir también notificaciones, completar SMTP. Ver [CRM.md](CRM.md). No copiar `.env.local` a GitHub. Los siguientes pushes a `main` se desplegarán automáticamente una vez conectado el repositorio con Vercel.

## Diseño y revisión

Composición editorial en marfil y verde profundo con una imagen ilustrativa de una mesa de trabajo contable y legal. Inicio tipográfico protagonista, marcos lineales, filas numeradas y bloque oscuro. Las animaciones respetan `prefers-reduced-motion`; el contenido se muestra sin JavaScript. La actividad inmobiliaria queda en segundo plano; su enlace selecciona el motivo sin borrar lo escrito.

Las capturas y el informe de navegador se guardan en `artifacts/`. El navegador integrado no pudo iniciarse por un error del entorno; se usó Chromium local mediante Playwright. Para repetir la revisión con el servidor iniciado:

```sh
npx playwright install chromium
node scripts/visual-check.mjs
```

El script usa Chromium instalado por Playwright de forma predeterminada; se puede indicar otro ejecutable con `CHROME_PATH`. Comprueba anchos 320, 360, 390, 768, 1024 y 1440, navegación móvil, Escape, FAQ con teclado, selección inmobiliaria, validación y ausencia de SMTP. Axe revisa desktop y móvil. La revisión de reflow a 720 px equivale al espacio CSS de 1440 px al 200%; no sustituye una prueba manual de zoom del navegador.

No se midió un puntaje Lighthouse ni métricas de campo. La auditoría inicial encontró avisos transitivos de desarrollo en la cadena ESLint/fast-glob/braces sin versión corregida compatible publicada en el registro consultado. No afectan al transporte SMTP actualizado. Consultar `npm audit` antes del despliegue.

## Pendiente para publicar

- Confirmación o reemplazo del logo provisional.
- Email, teléfono y WhatsApp confirmados y cargados. Dirección y redes solo si se aportan.
- Cobertura geográfica real.
- Dominio final.
- Credenciales SMTP, remitente y destinatario, más verificación autorizada del canal.
- PostgreSQL y variables privadas del CRM en Vercel; revisar su proxy/límite de frecuencia.
