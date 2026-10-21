import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Supabase migration preserves data and blocks client roles with grants and RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "CREATE ROLE anon; CREATE ROLE authenticated; GRANT USAGE ON SCHEMA public TO anon,authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated;",
    );
    const sql = await readFile(
      "supabase/migrations/202610210001_crm.sql",
      "utf8",
    );
    await db.exec(sql);
    await db.query(
      `INSERT INTO public.crm_inquiries(id,name,email,reason,message,created_at) VALUES($1,$2,$3,$4,$5,$6)`,
      [
        "test-id",
        "Test",
        "test@example.test",
        "Administración de consorcios",
        "Consulta de prueba",
        "2026-10-21T12:00:00.000Z",
      ],
    );
    await db.exec(sql);
    assert.equal(
      (
        await db.query<{ count: number }>(
          "SELECT COUNT(*)::integer AS count FROM public.crm_inquiries",
        )
      ).rows[0].count,
      1,
    );
    const rls = await db.query<{ relrowsecurity: boolean }>(
      `SELECT relrowsecurity FROM pg_class WHERE oid IN ('public.crm_inquiries'::regclass,'public.crm_limits'::regclass)`,
    );
    assert.ok(rls.rows.every((row) => row.relrowsecurity));
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(
        db.query("SELECT * FROM public.crm_inquiries"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("SELECT * FROM public.crm_limits"),
        /permission denied/,
      );
      await db.exec("RESET ROLE");
    }
    // If SELECT is accidentally regranted, lack of an RLS policy still hides all rows.
    await db.exec(
      "GRANT SELECT ON public.crm_inquiries TO anon; SET ROLE anon;",
    );
    assert.equal(
      (await db.query("SELECT * FROM public.crm_inquiries")).rows.length,
      0,
    );
    await db.exec("RESET ROLE");
    await db.exec(sql);
    await assert.rejects(
      db.query("UPDATE public.crm_inquiries SET status='invalid'"),
      /check constraint/,
    );
    await assert.rejects(
      db.query("UPDATE public.crm_inquiries SET notes=$1", ["x".repeat(5001)]),
      /check constraint/,
    );
    const limitQuery =
      "INSERT INTO public.crm_limits(key,count,reset_at) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=crm_limits.count+1 RETURNING count";
    await db.query(limitQuery, ["test-key", 12345]);
    assert.equal(
      (await db.query<{ count: number }>(limitQuery, ["test-key", 12345]))
        .rows[0].count,
      2,
    );
  } finally {
    await db.close();
  }
});
