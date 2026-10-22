# Supabase Auth y consultas

El acceso privado es `/consultas`. `/crm` redirige allí. El formulario público guarda consultas mediante una función limitada; las lecturas, notas, estados y eliminaciones requieren la sesión del administrador y políticas RLS.

## Activar tu proyecto

1. En Supabase → Authentication → Users → Add user, crear `lemosmoralesadministracion@gmail.com` con la contraseña elegida y **Auto Confirm User**.
2. Después, ejecutar todo [supabase/setup.sql](supabase/setup.sql) en SQL Editor. Registra como administrador únicamente ese correo confirmado. Puede repetirse sin borrar consultas. Si lo ejecutaste antes de crear el usuario, repetilo después.
3. En Vercel → Settings → Environment Variables configurar:

| Variable                               | Valor                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| `CRM_STORAGE`                          | `supabase`                                                   |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://vtjqitcvnsfwcgyaxlbm.supabase.co`                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La clave publicable suministrada, disponible en `.env.local` |
| `NEXT_PUBLIC_SITE_URL`                 | La URL HTTPS asignada por Vercel                             |
| `SITE_INDEXABLE`                       | `false` durante revisión                                     |

4. Hacer **Redeploy**, entrar a `/consultas`, iniciar sesión y verificar una consulta enviada desde el formulario.

Este modo no necesita `DATABASE_URL`, `CRM_PASSWORD_HASH` ni `CRM_SESSION_SECRET`. La contraseña se administra en Supabase Auth y no se incorpora a Git. Otros usuarios de Auth no pueden leer consultas.

## Comprobar

Ejecutar `npm run supabase:check`: comprueba Auth, versión del esquema y existencia del administrador, sin leer consultas ni imprimir credenciales. Durante esta entrega Auth respondió; faltaba instalar el esquema. La prueba completa en la nube depende de los pasos anteriores.

La función pública valida campos y limita a tres envíos por email y cien totales cada diez minutos. El endpoint añade controles de origen, tamaño y frecuencia. El administrador puede leer, modificar estado/notas y eliminar, sin cambiar el mensaje original. El esquema privado y los contadores no están disponibles para los clientes.

Las pruebas ejecutan el SQL sobre PostgreSQL local con roles anónimo, autenticado y administrador. Verifican RLS, permisos, límites y reejecución sin perder datos; no escriben en tu proyecto remoto.

## Correo y alternativas

Responder por email abre tu aplicación de correo con el destinatario; no sincroniza Gmail. Los avisos automáticos requieren SMTP según [CRM.md](CRM.md). Registrar su estado en Supabase requiere opcionalmente `SUPABASE_SECRET_KEY` solo en el servidor; no es necesaria para recibir consultas ni acceder al panel.

SQLite (`CRM_STORAGE=sqlite`) queda disponible para desarrollo. PostgreSQL directo con `DATABASE_URL` conserva el acceso por hash como alternativa. Los comandos `db:migrate` y `db:check` corresponden a ese modo anterior, no al modo Supabase Auth.

Referencias: [sesiones SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [claves API](https://supabase.com/docs/guides/api/api-keys) y [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
