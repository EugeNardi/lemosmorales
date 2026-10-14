# Verificación de la entrega

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
