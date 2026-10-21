import { randomUUID, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ContactData } from "../validation";
import type { DatabaseSync } from "node:sqlite";
import type { Pool } from "pg";

export const statuses = ["new", "contacted", "closed"] as const;
export type Status = (typeof statuses)[number];
export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  building: string;
  reason: string;
  message: string;
  status: Status;
  notes: string;
  created_at: string;
  notification: string;
};
type Connection = {
  sqlite?: DatabaseSync;
  postgres?: Pool;
  ready?: Promise<void>;
  opening?: Promise<void>;
};
const globalStore = globalThis as typeof globalThis & {
  crmConnection?: Connection;
};

export function storageConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
    (!process.env.VERCEL && process.env.CRM_STORAGE === "sqlite"),
  );
}
async function connection() {
  if (!storageConfigured()) throw new Error("CRM storage unavailable");
  if (!globalStore.crmConnection) globalStore.crmConnection = {};
  const state = globalStore.crmConnection;
  if (!state.sqlite && !state.postgres) {
    state.opening ||= (async () => {
      if (process.env.DATABASE_URL) {
        const { Pool } = await import("pg");
        state.postgres = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 3,
          connectionTimeoutMillis: 8000,
          idleTimeoutMillis: 10000,
        });
      } else {
        const { DatabaseSync } = await import("node:sqlite");
        const path = resolve(
          /* turbopackIgnore: true */ process.env.CRM_SQLITE_PATH ||
            ".data/crm.sqlite",
        );
        mkdirSync(dirname(path), { recursive: true });
        state.sqlite = new DatabaseSync(path);
        state.sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
      }
    })().catch((error) => {
      state.opening = undefined;
      throw error;
    });
    await state.opening;
  }
  return state;
}
async function run<T extends Record<string, unknown>>(
  sql: string,
  params: (string | number)[] = [],
): Promise<T[]> {
  const state = await connection();
  if (state.postgres)
    return (await state.postgres.query(sql, params)).rows as T[];
  // Every placeholder appears once and in ascending order in these statements.
  const statement = state.sqlite!.prepare(sql.replace(/\$\d+/g, "?"));
  return statement.all(...params) as T[];
}
export async function initializeStore() {
  const state = await connection();
  if (!state.ready)
    state.ready = (async () => {
      await run(
        `CREATE TABLE IF NOT EXISTS crm_inquiries (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,building TEXT NOT NULL,reason TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,notification TEXT NOT NULL DEFAULT 'unconfigured')`,
      );
      await run(
        "CREATE INDEX IF NOT EXISTS crm_inquiries_created ON crm_inquiries(created_at)",
      );
      await run(
        "CREATE TABLE IF NOT EXISTS crm_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at BIGINT NOT NULL)",
      );
    })().catch((error) => {
      state.ready = undefined;
      throw error;
    });
  await state.ready;
}
export async function saveInquiry(data: ContactData) {
  await initializeStore();
  const id = randomUUID();
  await run(
    "INSERT INTO crm_inquiries (id,name,email,phone,building,reason,message,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      id,
      data.name,
      data.email,
      data.phone,
      data.building,
      data.reason,
      data.message,
      new Date().toISOString(),
    ],
  );
  return id;
}
export async function setNotification(id: string, state: "sent" | "failed") {
  await initializeStore();
  await run("UPDATE crm_inquiries SET notification=$1 WHERE id=$2", [
    state,
    id,
  ]);
}
export async function listInquiries({
  search = "",
  status = "",
  page = 1,
}: { search?: string; status?: string; page?: number } = {}) {
  await initializeStore();
  const offset = (Math.max(1, Math.min(page, 100000)) - 1) * 20;
  const params: (string | number)[] = [];
  const filters: string[] = [];
  if (statuses.includes(status as Status)) {
    params.push(status);
    filters.push(`status=$${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase().replace(/[!%_]/g, "!$&")}%`);
    filters.push(
      `LOWER(name || ' ' || email || ' ' || building || ' ' || message) LIKE $${params.length} ESCAPE '!'`,
    );
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const total = await run<{ total: number }>(
    `SELECT COUNT(*) AS total FROM crm_inquiries${where}`,
    params,
  );
  const rows = await run<Inquiry>(
    `SELECT * FROM crm_inquiries${where} ORDER BY created_at DESC LIMIT 20 OFFSET ${offset}`,
    params,
  );
  const counts = await run<{ status: Status; total: number }>(
    "SELECT status,COUNT(*) AS total FROM crm_inquiries GROUP BY status",
  );
  return { rows, total: Number(total[0].total), counts };
}
export async function getInquiry(id: string) {
  await initializeStore();
  return (
    (await run<Inquiry>("SELECT * FROM crm_inquiries WHERE id=$1", [id]))[0] ||
    null
  );
}
export async function updateInquiry(id: string, status: Status, notes: string) {
  await initializeStore();
  await run("UPDATE crm_inquiries SET status=$1,notes=$2 WHERE id=$3", [
    status,
    notes,
    id,
  ]);
}
export async function removeInquiry(id: string) {
  await initializeStore();
  await run("DELETE FROM crm_inquiries WHERE id=$1", [id]);
}
export async function consumeLimit(
  identity: string,
  limit = 5,
  windowMs = 600000,
  now = Date.now(),
) {
  await initializeStore();
  const key = createHash("sha256").update(identity).digest("hex");
  await run("DELETE FROM crm_limits WHERE reset_at < $1", [now]);
  const rows = await run<{ count: number }>(
    `INSERT INTO crm_limits (key,count,reset_at) VALUES ($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=crm_limits.count+1 RETURNING count`,
    [key, now + windowMs],
  );
  return Number(rows[0].count) <= limit;
}
export async function closeStore() {
  const state = globalStore.crmConnection;
  globalStore.crmConnection = undefined;
  state?.sqlite?.close();
  await state?.postgres?.end();
}
