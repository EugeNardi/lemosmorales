# Conectar el CRM a Supabase

La aplicación usa PostgreSQL de Supabase **solo desde el servidor**. Mantiene el acceso propio del CRM; no necesita Supabase Auth, claves `anon`, `service_role` ni un SDK en el navegador.

## 1. Crear el esquema

En el proyecto de Supabase, abrir **SQL Editor → New query**, pegar y ejecutar todo [supabase/migrations/202610210001_crm.sql](supabase/migrations/202610210001_crm.sql).

La migración crea `public.crm_inquiries` (consultas y seguimiento), `public.crm_limits` (límites de frecuencia) e índices. Activa RLS y revoca acceso a `PUBLIC`, `anon` y `authenticated`. No crea políticas públicas ni elimina consultas existentes. El servidor se conecta con el propietario de la base, que puede operar estas tablas privadas.

El runtime ya no crea tablas PostgreSQL desde una solicitud: exige la migración antes de usar el CRM. SQLite local conserva su inicialización automática.

## 2. Obtener la conexión

En **Connect**, copiar la URI de **Transaction pooler** para Vercel (normalmente puerto **6543**). Usar el usuario y host completos que muestra el panel, sin reconstruirlos manualmente. Sustituir el marcador por la contraseña de la **base de datos**, codificada para una URL si tiene caracteres especiales. Es distinta a la contraseña del CRM y a la de Gmail.

Usar TLS: agregar `sslmode=verify-full` en la URI y configurar el certificado raíz indicado por Supabase si la conexión lo requiere. No desactivar la validación del certificado para resolver errores. El driver `pg` usa consultas sin prepared statements con nombre, compatibles con el pooler de transacciones. El pool de la aplicación limita a una conexión por instancia.

Referencias: [conexiones PostgreSQL de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 3. Variables privadas en Vercel

En Settings → Environment Variables, configurar:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | URI real del pooler, con TLS |
| `CRM_ADMIN_EMAIL` | `lemosmoralesadministracion@gmail.com` |
| `CRM_PASSWORD_HASH` | Hash scrypt existente en `.env.local` |
| `CRM_SESSION_SECRET` | Secreto aleatorio existente en `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | URL pública real de la landing |
| `SITE_INDEXABLE` | `false` durante revisión |

No configurar `CRM_STORAGE=sqlite` en Vercel. Las credenciales privadas no deben llevar prefijo `NEXT_PUBLIC_`. No pegarlas en el chat ni en GitHub. Después de guardar las variables, hacer **Redeploy**.

SMTP es opcional para guardar en el CRM. Si se desean avisos por Gmail, completar las variables de [CRM.md](CRM.md).

## 4. Verificar

Para comprobar desde esta computadora, establecer la misma `DATABASE_URL` en `.env.local` y ejecutar:

```sh
npm run db:check
```

Comprueba conexión, columnas, RLS y permisos. No imprime la conexión ni lee mensajes de consultas. Como alternativa al SQL Editor, `npm run db:migrate` aplica la misma migración y verifica el esquema; ejecutarlo solo cuando se haya configurado la base correcta.

Finalmente, entrar a `/crm`, enviar una consulta de prueba desde el sitio, comprobar que aparece y eliminar esa consulta de prueba. Los datos de SQLite no se trasladan automáticamente. Configurar backups y retención en el proyecto.

Esta entrega prepara la migración para su conexión. La verificación contra tu proyecto real queda pendiente hasta configurar las variables.
