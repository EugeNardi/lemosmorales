# CRM de Lemos Morales

Acceso: `/crm`, también disponible desde “Acceso al equipo” en el pie de la landing. Usuario: `lemosmoralesadministracion@gmail.com`. La contraseña indicada se configuró **solo localmente como hash scrypt**, fuera de Git y del código público.

## Funciones

Bandeja paginada, búsqueda por nombre/email/consorcio/mensaje, filtros, estados Nueva / En seguimiento / Cerrada, notas internas y eliminación con confirmación. “Responder por email” abre tu aplicación de correo: no es un cliente de Gmail ni sincroniza sus conversaciones.

Cada lectura y modificación privada verifica la sesión. La cookie es HttpOnly, SameSite=Lax y Secure en producción, con vencimiento de ocho horas. Cambiar el hash o el secreto invalida las sesiones existentes. No hay contraseñas de visitantes ni registros públicos de usuarios.

## Configuración local

`.env.local` ya contiene el usuario, un hash de contraseña y un secreto aleatorio. `CRM_STORAGE=sqlite` guarda las consultas en `.data/crm.sqlite`, excluido de Git y del despliegue. Node 24 incluye SQLite, todavía marcado como experimental en esta versión.

Para configurar o rotar el acceso, ejecutar `node scripts/setup-crm.mjs lemosmoralesadministracion@gmail.com` y suministrar la contraseña por entrada estándar. No escribirla dentro del script ni guardarla en Git. El comando genera el hash y el secreto y los escribe en `.env.local`; no imprime esos valores. Rotar el acceso cierra las sesiones anteriores.

Mantener copias de seguridad de `.data/` y definir una política de retención de las consultas. El CRM permite eliminarlas con confirmación.

## Activar en Vercel

Para Supabase, seguir [SUPABASE.md](SUPABASE.md): incluye la migración SQL, la conexión y la comprobación de permisos.

1. Conectar una base **PostgreSQL persistente** y establecer `DATABASE_URL` con la conexión del proveedor, incluyendo SSL según sus instrucciones. SQLite se rechaza en Vercel: su disco no es persistente.
2. Configurar `CRM_ADMIN_EMAIL`, `CRM_PASSWORD_HASH` y `CRM_SESSION_SECRET` como variables privadas del servidor en Vercel. Se pueden copiar desde `.env.local` al panel seguro de Vercel. No usar el prefijo `NEXT_PUBLIC_` ni publicar estos valores en GitHub o el chat.
3. Aplicar la migración SQL antes del primer acceso. El servidor verifica las tablas existentes, sin crearlas desde las solicitudes. Configurar backups en el proveedor.
4. Desplegar y verificar acceso, envío y persistencia. Los contadores de frecuencia del CRM se comparten en la base. Activar `TRUST_PROXY=true` únicamente si el proxy sanea y sobrescribe `X-Forwarded-For`.

No se creó ni contrató una base externa automáticamente. Sin credenciales no se verificó PostgreSQL remoto. La persistencia local sí tiene pruebas SQLite.

## Notificaciones por Gmail

Las consultas se guardan en el CRM aunque SMTP no esté configurado. Para que llegue también un aviso a Gmail:

- `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
- `SMTP_USER`, `CONTACT_FROM` y `CONTACT_TO`: `lemosmoralesadministracion@gmail.com`.
- `SMTP_PASS`: una **contraseña de aplicación de Google**. La contraseña del CRM no se utiliza para entrar a Gmail. Ver [ayuda oficial de Google](https://support.google.com/accounts/answer/185833?hl=es).

Sin esa configuración no se envían notificaciones. El CRM registra si el proveedor aceptó el correo o si falló; en ambos casos conserva la consulta. No se enviaron correos reales de prueba.

## Verificación

`npm test` prueba hashes, sesiones manipuladas/expiradas, rotación, persistencia, búsqueda, seguimiento, eliminación, límites compartidos y recepción mediante el endpoint.

`scripts/crm-check.mjs` usa únicamente el servidor local y lee `CRM_E2E_PASSWORD` de una variable de entorno temporal. Crea una consulta ficticia, la consulta y actualiza con sesión, comprueba bloqueo sin sesión y la elimina al terminar. Rechaza ejecutarse con `SMTP_PASS` configurado para evitar correos externos. No imprimir ni guardar la contraseña como parte de los resultados.
