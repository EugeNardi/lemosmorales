// Run only against local development. Credentials are read from process env, never printed.
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
process.loadEnvFile(".env.local");
if (!process.env.CRM_E2E_PASSWORD)
  throw new Error("Set CRM_E2E_PASSWORD locally before running the CRM check.");
if (process.env.SMTP_PASS)
  throw new Error("Disable SMTP before this local-only test.");
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
const report = { checks: [], accessibility: [], runtimeErrors: [] };
page.on("pageerror", (error) =>
  report.runtimeErrors.push(error.message.split("\n")[0]),
);
page.on("console", (message) => {
  if (message.type() === "error")
    report.runtimeErrors.push(message.text().split("\n")[0]);
});
await mkdir("artifacts", { recursive: true });
try {
  await page.goto("http://127.0.0.1:3000/crm");
  await expect(page).toHaveURL(/\/crm\/login$/);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Consultas recibidas." }),
  ).toHaveCount(0);
  await page.getByLabel("Correo de acceso").fill(process.env.CRM_ADMIN_EMAIL);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("incorrect-test-password");
  await page.getByRole("button", { name: "Ingresar al CRM" }).click();
  await expect(page.getByRole("status")).toContainText("no son correctos");
  report.checks.push(
    "Unauthenticated inbox redirects; wrong password rejected",
  );
  await page.screenshot({
    path: "artifacts/crm-login.png",
    fullPage: true,
    caret: "initial",
  });
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.CRM_E2E_PASSWORD);
  await page.getByRole("button", { name: "Ingresar al CRM" }).click();
  await expect(
    page.getByRole("heading", { name: "Consultas recibidas." }),
  ).toBeVisible();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "lm_crm_session",
  );
  if (!cookie?.httpOnly || cookie.sameSite !== "Lax" || cookie.path !== "/crm")
    throw new Error("Session cookie flags missing");
  const visitor = await browser.newContext();
  const form = await visitor.newPage();
  await form.goto("http://127.0.0.1:3000");
  await form.waitForLoadState("networkidle");
  const marker = `Prueba CRM ${Date.now()}`;
  await form.getByLabel("Nombre y apellido", { exact: true }).fill(marker);
  await form.getByLabel("Email", { exact: true }).fill("crm-test@example.test");
  await form
    .getByLabel("Consorcio y localidad (opcional)", { exact: true })
    .fill("Edificio de prueba local");
  await form
    .getByLabel("Mensaje", { exact: true })
    .fill("Consulta de prueba local para verificar el CRM.");
  await form.waitForTimeout(2100); // Exercise the actual two-second anti-spam requirement.
  await form.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(form.getByRole("status")).toContainText("Recibimos tu consulta");
  await page.reload();
  await page.getByRole("link").filter({ hasText: marker }).click();
  await expect(page.getByRole("heading", { name: marker })).toBeVisible();
  const inquiryPath = new URL(page.url()).pathname;
  await form.goto("http://127.0.0.1:3000" + inquiryPath);
  await expect(form).toHaveURL(/\/crm\/login$/);
  report.checks.push(
    "Real local form submission persisted and visible only after login",
  );
  await page.getByLabel("Estado de la consulta").selectOption("contacted");
  await page
    .getByLabel("Notas internas")
    .fill("Seguimiento de prueba: coordinar una conversación.");
  await page.getByRole("button", { name: "Guardar seguimiento" }).click();
  await expect(page.getByRole("status")).toContainText("Seguimiento guardado");
  await page.reload();
  await expect(page.getByLabel("Notas internas")).toHaveValue(
    "Seguimiento de prueba: coordinar una conversación.",
  );
  await page.screenshot({
    path: "artifacts/crm-detail.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("link", { name: "Volver a la bandeja" }).click();
  await page.getByLabel("Buscar consultas").fill(marker);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(
    page.getByRole("link").filter({ hasText: marker }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/crm-inbox.png",
    fullPage: true,
    caret: "initial",
  });
  report.accessibility.push({
    screen: "inbox",
    violations: (await new AxeBuilder({ page }).analyze()).violations.map(
      (v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }),
    ),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/crm-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("CRM mobile overflow");
  await page.getByRole("link").filter({ hasText: marker }).click();
  await page.getByText("Eliminar esta consulta", { exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Confirmo que quiero eliminarla" })
    .check();
  await page.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Consultas recibidas." }),
  ).toBeVisible();
  report.checks.push(
    "Status, notes, search, mobile and deletion of the test inquiry verified",
  );
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/crm\/login$/);
  await page.goto("http://127.0.0.1:3000/crm");
  await expect(page).toHaveURL(/\/crm\/login$/);
  report.checks.push("Logout revokes browser access");
  report.accessibility.push({
    screen: "login",
    violations: (await new AxeBuilder({ page }).analyze()).violations.map(
      (v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }),
    ),
  });
  await visitor.close();
  await writeFile(
    "artifacts/crm-verification.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.accessibility.some((item) => item.violations.length))
    throw new Error("CRM accessibility violations");
} catch (error) {
  await page.screenshot({
    path: "artifacts/crm-failure.png",
    fullPage: true,
    caret: "initial",
  });
  console.error("CRM check phase: " + report.checks.join(" / "));
  console.error(String(error.message).split("\n").slice(0, 9).join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
}
