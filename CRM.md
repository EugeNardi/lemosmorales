# CRM de Lemos Morales

Acceso: `/consultas`, también desde el pie de la landing. Administrador: `lemosmoralesadministracion@gmail.com`. Supabase Auth gestiona la contraseña y las sesiones SSR. Cada lectura y modificación verifica la sesión y el permiso de administrador.

## Activar

Seguir [SUPABASE.md](SUPABASE.md): crear el usuario confirmado, ejecutar `supabase/setup.sql`, configurar las variables en Vercel y desplegar nuevamente. La configuración local está en `.env.local`, excluido de Git.

## Funciones

Bandeja paginada, búsqueda, filtros, estados Nueva / En seguimiento / Cerrada, notas internas y eliminación con confirmación. Responder por email abre tu aplicación de correo; el teléfono permite iniciar una llamada. No sincroniza conversaciones de Gmail.

El formulario confirma recepción después de guardar realmente la consulta. Si la base no está lista, muestra el error y permite reintentar.

## Avisos por Gmail

Las consultas se guardan sin SMTP. Para recibir además avisos configurar variables privadas:

- `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
- `SMTP_USER`, `CONTACT_FROM`, `CONTACT_TO`: `lemosmoralesadministracion@gmail.com`.
- `SMTP_PASS`: contraseña de aplicación de Google, distinta de la contraseña del CRM. Ver [ayuda de Google](https://support.google.com/accounts/answer/185833?hl=es).

Si falla SMTP, la consulta guardada permanece disponible. Registrar su resultado en Supabase requiere `SUPABASE_SECRET_KEY` en el servidor; sin ella el detalle indica que ese seguimiento no está disponible. No se enviaron correos reales de prueba.

## Desarrollo alternativo

`CRM_STORAGE=sqlite` guarda en `.data/crm.sqlite`, excluido de Git, con Node 24. Conserva acceso por hash scrypt y cookie HttpOnly, SameSite=Lax, Secure en producción, de ocho horas. Configurarlo con `node scripts/setup-crm.mjs lemosmoralesadministracion@gmail.com`, suministrando la contraseña por entrada estándar. No usar SQLite en Vercel.

Definir backups y retención en Supabase. Los datos SQLite no se transfieren automáticamente. `npm test` verifica validación, persistencia, sesiones locales y permisos Supabase con PostgreSQL local aislado. `scripts/crm-check.mjs` comprueba el flujo local con un contacto ficticio y rechaza ejecutarse con SMTP habilitado.
