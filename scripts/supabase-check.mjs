import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Falta la configuración pública de Supabase.");
  process.exit(1);
}
try {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const settings = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  console.log(
    "Conexión con Supabase Auth: " +
      (settings.ok ? "verificada" : "no disponible"),
  );
  if (!settings.ok) {
    process.exitCode = 1;
  } else {
    const { data, error } = await client.rpc("crm_connection_status");
    if (error) {
      console.log("Falta ejecutar supabase/setup.sql en SQL Editor.");
      process.exitCode = 1;
    } else {
      console.log("Esquema de consultas: versión " + data.schema_version);
      console.log(
        "Administrador autorizado: " +
          (data.admin_ready
            ? "sí"
            : "pendiente; crear usuario confirmado y volver a ejecutar supabase/setup.sql"),
      );
      if (!data.admin_ready) process.exitCode = 1;
    }
  }
} catch {
  console.error(
    "No se pudo conectar al proyecto de Supabase. No se muestran claves ni credenciales.",
  );
  process.exitCode = 1;
}
