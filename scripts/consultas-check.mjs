import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.CRM_CHECK_URL || "http://127.0.0.1:3002";
if (new URL(base).hostname !== "127.0.0.1")
  throw new Error("Local checks only");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/consultas");
  await expect(
    page.getByRole("button", { name: "Ingresar al CRM" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Correo de acceso")).toBeVisible();
  await page.goto(base + "/crm");
  await expect(page).toHaveURL(base + "/consultas");
  await page.goto(base + "/consultas/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(base + "/consultas");
  await page.waitForLoadState("networkidle");
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/consultas-login.png",
    fullPage: true,
    caret: "initial",
  });
  const violations = (await new AxeBuilder({ page }).analyze()).violations.map(
    (v) => v.id,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile overflow");
  await writeFile(
    "artifacts/consultas-verification.json",
    JSON.stringify(
      { redirects: true, privateDetail: true, violations, errors },
      null,
      2,
    ),
  );
  if (violations.length || errors.length)
    throw new Error("Browser checks failed");
  console.log(
    "Login /consultas, redirects, private detail, mobile and accessibility: passed",
  );
} finally {
  await browser.close();
}
