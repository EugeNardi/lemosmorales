// Password arrives through stdin and is never printed or saved in plain text.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
const password = readFileSync(0, "utf8").replace(/\r?\n$/, "");
if (password.length < 10 || password.length > 256)
  throw new Error("Usá una contraseña de entre 10 y 256 caracteres.");
const email = process.argv[2];
if (!email || !/^\S+@\S+\.\S+$/.test(email))
  throw new Error("Indicá el correo de acceso como argumento.");
const salt = randomBytes(16).toString("hex");
const values = {
  CRM_STORAGE: "sqlite",
  CRM_ADMIN_EMAIL: email,
  CRM_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
  CRM_SESSION_SECRET: randomBytes(32).toString("hex"),
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: email,
  CONTACT_FROM: email,
  CONTACT_TO: email,
};
const file = ".env.local";
let existing = existsSync(file) ? readFileSync(file, "utf8") : "";
const keys = Object.keys(values);
existing = existing
  .split(/\r?\n/)
  .filter((line) => !keys.includes(line.split("=")[0]))
  .join("\n")
  .trim();
writeFileSync(
  file,
  `${existing}\n${Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`,
  { mode: 0o600 },
);
console.log(
  "Acceso local configurado. La contraseña se guardó únicamente como hash.",
);
