import {
  scrypt as scryptCallback,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { supabaseCrm, supabaseConfigured } from "@/utils/supabase/config";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function checkPassword(password: string, encoded: string) {
  const [scheme, salt, value] = encoded.split(":");
  if (scheme !== "scrypt" || !salt || !value || !/^[a-f0-9]{128}$/.test(value))
    return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(value, "hex"), actual);
}
function sessionKey() {
  const key = process.env.CRM_SESSION_SECRET;
  if (!key || key.length < 32) throw new Error("Session configuration missing");
  return key;
}
export function authConfigured() {
  if (supabaseCrm()) return supabaseConfigured();
  return Boolean(
    process.env.CRM_ADMIN_EMAIL &&
    process.env.CRM_PASSWORD_HASH &&
    (process.env.CRM_SESSION_SECRET?.length || 0) >= 32,
  );
}
export function makeSession(now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({
      email: process.env.CRM_ADMIN_EMAIL,
      exp: now + 28800000,
      nonce: randomBytes(16).toString("hex"),
      version: createHmac("sha256", sessionKey())
        .update(process.env.CRM_PASSWORD_HASH || "")
        .digest("hex"),
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", sessionKey()).update(payload).digest("base64url")}`;
}
export function readSession(token: string | undefined, now = Date.now()) {
  if (!authConfigured() || !token || token.length > 2048) return false;
  try {
    const [payload, signature, ...extra] = token.split(".");
    if (!signature || extra.length) return false;
    const expected = createHmac("sha256", sessionKey())
      .update(payload)
      .digest();
    const supplied = Buffer.from(signature, "base64url");
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const version = createHmac("sha256", sessionKey())
      .update(process.env.CRM_PASSWORD_HASH || "")
      .digest("hex");
    return (
      data.email === process.env.CRM_ADMIN_EMAIL &&
      Number.isFinite(data.exp) &&
      data.exp > now &&
      data.exp <= now + 28800000 &&
      data.version === version
    );
  } catch {
    return false;
  }
}
