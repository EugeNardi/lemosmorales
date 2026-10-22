# Verificación de la entrega

## Preparación Supabase y globo de WhatsApp

- Migración SQL explícita con tablas, restricciones, índices, RLS y revocación de permisos a los roles cliente. Verificada con PostgreSQL local embebido (PGlite): aplicación repetible sin perder datos, denegación a `anon`/`authenticated` y bloqueo por RLS incluso ante una concesión accidental de lectura.
- Runtime PostgreSQL preparado para usar el esquema migrado y una conexión por instancia; no crea tablas durante las solicitudes. Scripts `db:migrate` y `db:check`, variables y guía en SUPABASE.md. La conexión real a Supabase sigue pendiente de credenciales.
- Globo flotante de WhatsApp con mensaje codificado y número confirmado. La prueba de navegador intercepta el destino: comprueba apertura y texto sin efectuar solicitudes ni enviar mensajes externos. Se oculta al llegar al contacto para evitar tapar el formulario.
- Ocho pruebas aprobadas, lint sin errores, tipos y build aprobados. Axe no detectó infracciones en escritorio/móvil; sin desbordamientos entre 320 y 1440 px. Capturas actualizadas en artifacts/.

## Actualización de contacto y CRM — 21 de octubre de 2026

- Teléfono, WhatsApp con ícono y correo público confirmados incorporados en contacto y pie de página.
- Imagen generada con imagegen, optimizada a WebP, con leyenda de escena ilustrativa y prompt en ASSETS.md.
- CRM local verificado de extremo a extremo: acceso con contraseña, rechazo de credenciales erróneas, bloqueo sin sesión, recepción real del formulario en SQLite, estado, notas, búsqueda, vista móvil, eliminación de la consulta ficticia y cierre de sesión.
- Seis pruebas automatizadas de servidor aprobadas; lint y build de producción aprobados. La prueba de persistencia cierra y vuelve a abrir la base para verificar que los datos no dependan de memoria.
- Axe sin infracciones detectadas en la landing (desktop/móvil) y en acceso/bandeja del CRM. Sin desbordamientos de la landing a 320–1440 px; CRM verificado a 390 px.
- Credenciales locales guardadas solo como hash scrypt y secreto aleatorio en `.env.local`, excluido de Git. Base `.data/` y datos locales excluidos del despliegue.
- No se enviaron correos reales. Gmail necesita una contraseña de aplicación y Vercel necesita PostgreSQL (`DATABASE_URL`) y las variables privadas del CRM. No se verificó PostgreSQL remoto sin credenciales. Ver CRM.md.

Las verificaciones anteriores documentan las entregas previas; esta actualización reemplaza su descripción de la página sin imágenes y del formulario exclusivamente SMTP.

Entorno: Windows, Node 24.13.0, Next 16.4.0. Revisión de navegador sobre la vista previa local con Chromium 1243 / Playwright. No se enviaron correos externos ni se publicó el sitio.

Actualización visual: se retiraron las fotografías y se recompuso el hero y Nosotros con tipografía y líneas. Se añadieron entradas de 500–550 ms y transiciones de 200–250 ms. Se verificó ausencia de imágenes en el contenido y que, con movimiento reducido, no haya animaciones activas. Capturas e informe actualizados en `artifacts/`.

- Instalación completada con `npm install`; dependencias fijadas en `package-lock.json`.
- Comprobación TypeScript y ESLint sin errores ni advertencias.
- Build de producción completado. El primer intento dentro del sandbox encontró `spawn EPERM`; se ejecutó correctamente con permiso para iniciar los procesos de Next.
- Cuatro pruebas de servidor pasan: validación y límites, rate limit, rechazo de solicitudes inválidas/antispam/configuración ausente, aceptación y rechazo SMTP local. La última prueba cubre también respuestas 200 y 502 del endpoint y que un transporte sin destinatarios aceptados no produce éxito.
- Chromium: anchos 320, 360, 390, 768, 1024 y 1440 px sin desbordamiento horizontal. Capturas completas por ancho en `artifacts/` y vistas iniciales en `desktop.png` y `mobile.png`.
- Formulario: errores junto a campos, email inválido, selección inmobiliaria sin borrar datos, configuración ausente, conservación de datos para reintento, fixtures de éxito/fallo exclusivamente en navegador de pruebas y bloqueo del envío mientras procesa.
- Menú móvil: apertura, cierre, Escape con retorno del foco y navegación a contacto. FAQ con click y teclado.
- Axe: **cero infracciones detectadas** en desktop y móvil tras corregir el contraste de la numeración. Esta revisión automatizada no equivale a una certificación de accesibilidad.
- Metadatos de vista previa: `es-AR`, un H1, título correcto, `noindex, nofollow`, sin canonical ni URL social inventados. Imagen social propia de 1200 × 630 px disponible en `public/social.png`, activada en los metadatos al configurar el dominio.
- Reflow a 720 px sin desbordamiento, equivalente al ancho CSS de una pantalla de 1440 px al 200%. No se verificó el zoom manual de la interfaz del navegador.
- `npm audit --omit=dev`: cero vulnerabilidades reportadas. La cadena de herramientas de desarrollo ESLint mantiene cinco avisos transitivos relacionados con braces; no se forzó un downgrade incompatible. Revisar el registro para actualizaciones antes del despliegue.

No se midieron Lighthouse, Core Web Vitals de campo ni entrega SMTP real. El navegador integrado falló al iniciar por un error del entorno; se utilizó Chromium local como alternativa. Detalle reproducible de la última revisión en `artifacts/verification.json`.

Falta para publicar: confirmación de marca, contactos reales, cobertura, dominio, SMTP y verificación autorizada de recepción. Ver [README.md](README.md).

# Integración Supabase Auth — 22/10/2026

Build de producción, tipos y nueve pruebas automatizadas aprobados. La prueba PostgreSQL aislada verifica envío anónimo limitado, RLS, bloqueo de otros usuarios, acceso del administrador, edición restringida y migración repetible sin pérdida de consultas. Chromium verifica `/consultas`, redirección de `/crm`, bloqueo del detalle privado, reflow móvil y Axe sin infracciones. Evidencia en `artifacts/consultas-verification.json` y `consultas-login.png`.

El endpoint real de Supabase Auth respondió a la configuración suministrada. `npm run supabase:check` detectó que falta ejecutar `supabase/setup.sql`. El usuario indicó que aún no creó su cuenta Auth. No se probaron login ni persistencia en el proyecto remoto; no se crearon usuarios ni se enviaron emails reales. La activación requiere los pasos de `SUPABASE.md` y las variables correspondientes en Vercel.
