import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const mode = process.argv[2];
if (!["check", "migrate"].includes(mode))
  throw new Error("Usá npm run db:check o npm run db:migrate.");
if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Configurala en .env.local o en el entorno, sin publicarla en Git.",
  );
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});
try {
  if (mode === "migrate") {
    const sql = await readFile(
      new URL("../supabase/migrations/202610210001_crm.sql", import.meta.url),
      "utf8",
    );
    await pool.query(sql);
    console.log(
      "Esquema CRM aplicado. No se borraron consultas ni se crearon datos de ejemplo.",
    );
  }
  await pool.query(
    "SELECT id,name,email,phone,building,reason,message,status,notes,created_at,notification FROM public.crm_inquiries LIMIT 0",
  );
  await pool.query("SELECT key,count,reset_at FROM public.crm_limits LIMIT 0");
  const result = await pool.query(
    `SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('crm_inquiries','crm_limits')`,
  );
  if (
    result.rows.length !== 2 ||
    result.rows.some((row) => !row.relrowsecurity)
  )
    throw new Error("RLS");
  const grants = await pool.query(
    `SELECT grantee FROM information_schema.table_privileges WHERE table_schema='public' AND table_name IN ('crm_inquiries','crm_limits') AND grantee IN ('PUBLIC','anon','authenticated')`,
  );
  if (grants.rows.length) throw new Error("public grants");
  console.log(
    "Conexión, columnas, RLS y permisos verificados. No se leyeron datos de consultas.",
  );
} catch {
  console.error(
    "No se pudo verificar el CRM. Revisá la conexión, TLS y la migración en Supabase. No se muestran credenciales en este registro.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
