import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

test("Supabase Auth limits submissions and restricts client data to the administrator", async () => {
  const db = new PGlite();
  const admin = randomUUID(),
    outsider = randomUUID();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      GRANT USAGE ON SCHEMA public TO anon,authenticated;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,email_confirmed_at TIMESTAMPTZ);
      CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE SQL STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    await db.query(
      "INSERT INTO auth.users VALUES($1,$2,now()),($3,'outsider@example.test',now())",
      [admin, "lemosmoralesadministracion@gmail.com", outsider],
    );
    const sql = await readFile("supabase/setup.sql", "utf8");
    await db.exec(sql);
    await db.exec("SET ROLE anon");
    const submit = () =>
      db.query<{ id: string }>(
        "SELECT public.crm_submit_inquiry($1,'Cliente','client@example.test','','','Otra consulta','Consulta de prueba',$2,'') AS id",
        [randomUUID(), Date.now() - 5000],
      );
    const id = (await submit()).rows[0].id;
    await submit();
    await submit();
    await assert.rejects(submit(), /crm_rate_limit/);
    await assert.rejects(
      db.query("SELECT * FROM public.crm_inquiries"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("SELECT * FROM private.crm_admins"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("SELECT public.crm_list_inquiries()"),
      /permission denied/,
    );
    await db.exec("RESET ROLE; SET ROLE authenticated");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      outsider,
    ]);
    assert.equal(
      (await db.query("SELECT * FROM public.crm_inquiries")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("SELECT public.crm_list_inquiries()"),
      /crm_not_authorized/,
    );
    assert.equal(
      (await db.query("DELETE FROM public.crm_inquiries RETURNING id")).rows
        .length,
      0,
    );
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
      admin,
    ]);
    const inbox = await db.query<{ result: { total: number } }>(
      "SELECT public.crm_list_inquiries() AS result",
    );
    assert.equal(inbox.rows[0].result.total, 3);
    await db.query(
      "UPDATE public.crm_inquiries SET status='contacted',notes='Llamar' WHERE id=$1",
      [id],
    );
    await assert.rejects(
      db.query("UPDATE public.crm_inquiries SET email='changed@example.test'"),
      /permission denied/,
    );
    assert.equal(
      (
        await db.query<{ result: { total: number } }>(
          "SELECT public.crm_list_inquiries('%') AS result",
        )
      ).rows[0].result.total,
      0,
    );
    await db.query("DELETE FROM public.crm_inquiries WHERE id=$1", [id]);
    await db.exec("RESET ROLE");
    await db.exec(sql);
    assert.equal(
      (
        await db.query<{ count: number }>(
          "SELECT count(*)::integer AS count FROM public.crm_inquiries",
        )
      ).rows[0].count,
      2,
    );
  } finally {
    await db.close();
  }
});
