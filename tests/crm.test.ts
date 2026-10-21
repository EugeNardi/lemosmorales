import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import {
  hashPassword,
  checkPassword,
  makeSession,
  readSession,
} from "../src/lib/crm/security";
import {
  saveInquiry,
  getInquiry,
  listInquiries,
  updateInquiry,
  removeInquiry,
  consumeLimit,
  closeStore,
} from "../src/lib/crm/store";
import { POST } from "../src/app/api/contact/route";

test("password hashing, session integrity, expiry and password rotation", async () => {
  process.env.CRM_ADMIN_EMAIL = "admin@example.test";
  process.env.CRM_SESSION_SECRET = "a".repeat(64);
  const hash = await hashPassword("a test password only");
  process.env.CRM_PASSWORD_HASH = hash;
  assert.ok(await checkPassword("a test password only", hash));
  assert.equal(await checkPassword("wrong password", hash), false);
  assert.equal(await checkPassword("x", "broken"), false);
  const token = makeSession(1000);
  assert.ok(readSession(token, 1001));
  assert.equal(readSession(token + "x", 1001), false);
  assert.equal(readSession(token, 1000 + 28800001), false);
  assert.equal(readSession(undefined), false);
  process.env.CRM_PASSWORD_HASH = await hashPassword(
    "a different test password",
  );
  assert.equal(readSession(token, 1001), false);
});
test("persistent CRM receipt, search, tracking, deletion and shared rate limits", async () => {
  const file = resolve(`.data/test-${randomUUID()}.sqlite`);
  process.env.CRM_STORAGE = "sqlite";
  process.env.CRM_SQLITE_PATH = file;
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.SMTP_HOST;
  const data = {
    name: "Consulta de prueba",
    email: "inquiry@example.test",
    phone: "",
    building: "Consorcio 100%",
    reason: "Administración de consorcios",
    message: "Necesitamos una propuesta. <script>not executable</script>",
    website: "",
    startedAt: Date.now() - 10000,
  };
  try {
    const id = await saveInquiry(data);
    assert.equal((await getInquiry(id))?.message, data.message);
    assert.equal((await listInquiries({ search: "100%" })).total, 1);
    assert.equal((await listInquiries({ search: "not executable" })).total, 1);
    assert.equal((await listInquiries({ search: "' OR 1=1 --" })).total, 0);
    await updateInquiry(id, "contacted", "Llamar la próxima semana");
    assert.equal((await getInquiry(id))?.notes, "Llamar la próxima semana");
    assert.equal((await listInquiries({ status: "contacted" })).total, 1);
    const request = () =>
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
    assert.equal((await POST(request())).status, 200);
    assert.equal((await listInquiries()).total, 2);
    // Reopen the connection to prove persistence independently of in-memory state.
    await closeStore();
    assert.equal((await listInquiries()).total, 2);
    for (let i = 0; i < 3; i++)
      assert.equal(await consumeLimit("persistent-test", 3, 1000, 10000), true);
    assert.equal(await consumeLimit("persistent-test", 3, 1000, 10000), false);
    assert.equal(await consumeLimit("persistent-test", 3, 1000, 11001), true);
    await removeInquiry(id);
    assert.equal(await getInquiry(id), null);
  } finally {
    await closeStore();
    for (const suffix of ["", "-wal", "-shm"])
      await rm(file + suffix, { force: true });
  }
});
