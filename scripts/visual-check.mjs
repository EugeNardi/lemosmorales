import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
await mkdir("artifacts", { recursive: true });
const report = { sizes: [], interactions: [], accessibility: [] };
await page.goto("http://127.0.0.1:3000");
await page.waitForLoadState("networkidle");
await page.evaluate(() => document.fonts.ready);
if (await page.locator("main img").count())
  throw new Error("Photographs remain on page");
report.metadata = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  h1Count: document.querySelectorAll("h1").length,
  title: document.title,
  robots: document
    .querySelector('meta[name="robots"]')
    ?.getAttribute("content"),
  canonical: document
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href"),
  ogImage: document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content"),
}));
if (
  report.metadata.lang !== "es-AR" ||
  report.metadata.h1Count !== 1 ||
  !report.metadata.robots?.includes("noindex") ||
  report.metadata.canonical
)
  throw new Error("Preview metadata failed");
for (const width of [320, 360, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.screenshot({ path: `artifacts/${width}.png`, fullPage: true });
  report.sizes.push(
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    })),
  );
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: "artifacts/desktop.png" });
await page.waitForFunction(() =>
  document
    .getAnimations()
    .every((animation) => animation.playState !== "running"),
);
report.accessibility.push({
  viewport: "desktop",
  ...(await new AxeBuilder({ page }).analyze()).violations
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => n.target),
    }))
    .reduce(
      (a, v) => {
        a.violations.push(v);
        return a;
      },
      { violations: [] },
    ),
});
await page.getByRole("button", { name: "Enviar consulta" }).click();
if (!(await page.getByText("Ingresá tu nombre y apellido.").isVisible()))
  throw new Error("Missing validation");
await page
  .getByLabel("Nombre y apellido", { exact: true })
  .fill("Prueba de revisión");
await page.getByLabel("Email", { exact: true }).fill("invalid");
await page.getByRole("button", { name: "Enviar consulta" }).click();
if (!(await page.getByText("Ingresá un email válido.").isVisible()))
  throw new Error("Email validation missing");
await page.getByLabel("Email", { exact: true }).fill("revision@example.test");
await page
  .getByLabel("Mensaje", { exact: true })
  .fill("Consulta de prueba local.");
await page
  .getByRole("link", { name: "Consultar por servicios inmobiliarios" })
  .click();
if (
  (await page.getByLabel("Motivo de la consulta").inputValue()) !==
  "Consulta inmobiliaria"
)
  throw new Error("Reason not selected");
if (
  (await page.getByLabel("Nombre y apellido", { exact: true }).inputValue()) !==
  "Prueba de revisión"
)
  throw new Error("Data lost");
await page.getByRole("button", { name: "Enviar consulta" }).click();
await page
  .getByRole("status")
  .filter({ hasText: "todavía no está habilitado" })
  .waitFor();
if (
  (await page.getByLabel("Mensaje", { exact: true }).inputValue()) !==
  "Consulta de prueba local."
)
  throw new Error("Error erased data");
report.interactions.push(
  "Client validation, property selection with data preservation, absent SMTP configuration and retry",
);
// Browser-only response fixtures. No live provider or real messages are used.
await page.route("**/api/contact", (route) =>
  route.fulfill({
    status: 502,
    contentType: "application/json",
    body: JSON.stringify({
      message: "Fallo del proveedor de prueba. Podés reintentar.",
    }),
  }),
);
await page.getByRole("button", { name: "Enviar consulta" }).click();
await page
  .getByRole("status")
  .filter({ hasText: "Fallo del proveedor de prueba" })
  .waitFor();
if (
  (await page.getByLabel("Mensaje", { exact: true }).inputValue()) !==
  "Consulta de prueba local."
)
  throw new Error("Provider error erased data");
await page.unroute("**/api/contact");
let finishResponse;
let sendCount = 0;
const pending = new Promise((resolve) => {
  finishResponse = resolve;
});
await page.route("**/api/contact", async (route) => {
  sendCount++;
  await pending;
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      message: "Consulta aceptada por el transporte de prueba.",
    }),
  });
});
await page.getByRole("button", { name: "Enviar consulta" }).click();
if (!(await page.getByRole("button", { name: "Enviando…" }).isDisabled()))
  throw new Error("Submit not locked");
finishResponse();
await page
  .getByRole("status")
  .filter({ hasText: "transporte de prueba" })
  .waitFor();
if (
  sendCount !== 1 ||
  (await page.getByLabel("Mensaje", { exact: true }).inputValue()) !== ""
)
  throw new Error("Success or lock failed");
await page.unroute("**/api/contact");
report.interactions.push(
  "Browser-only provider failure/success fixtures; data preservation and double-submit lock",
);
const faq = page
  .locator("summary")
  .filter({ hasText: "¿Cuentan con un área legal?" });
await faq.click();
if (
  !(await page
    .getByText(
      "Sí. Lemos Morales cuenta con un área legal integrada a su metodología de trabajo.",
    )
    .isVisible())
)
  throw new Error("FAQ failed");
await faq.press("Enter");
report.interactions.push("FAQ opens with click and closes with keyboard");
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:3000");
await page.waitForLoadState("networkidle");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "artifacts/mobile.png" });
await page.getByRole("button", { name: "Abrir menú" }).click();
if (!(await page.getByRole("navigation", { name: "Principal" }).isVisible()))
  throw new Error("Menu did not open");
await page
  .getByRole("navigation", { name: "Principal" })
  .getByRole("link", { name: "Nosotros", exact: true })
  .focus();
await page.keyboard.press("Escape");
if (
  (await page
    .getByRole("button", { name: "Abrir menú" })
    .getAttribute("aria-expanded")) !== "false"
)
  throw new Error("Escape failed");
await page.getByRole("button", { name: "Abrir menú" }).click();
await page
  .getByRole("navigation", { name: "Principal" })
  .getByRole("link", { name: "Contacto", exact: true })
  .click();
if (
  (await page
    .getByRole("button", { name: "Abrir menú" })
    .getAttribute("aria-expanded")) !== "false"
)
  throw new Error("Link did not close menu");
report.interactions.push("Mobile menu, Escape focus return, anchor navigation");
await page.waitForFunction(
  () => document.getElementById("contacto").getBoundingClientRect().top < 150,
);
await page.waitForFunction(() =>
  document
    .getAnimations()
    .every((animation) => animation.playState !== "running"),
);
report.accessibility.push({
  viewport: "mobile",
  violations: (await new AxeBuilder({ page }).analyze()).violations.map(
    (v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    }),
  ),
});
await page.setViewportSize({ width: 720, height: 500 });
report.zoomEquivalent = await page.evaluate(() => ({
  layoutWidth: innerWidth,
  overflow: document.documentElement.scrollWidth > innerWidth,
  note: "Reflow equivalent to 1440px at 200%; not browser chrome zoom",
}));
await writeFile("artifacts/verification.json", JSON.stringify(report, null, 2));
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://127.0.0.1:3000");
await page.waitForLoadState("networkidle");
report.reducedMotion = await page.evaluate(() => ({
  heroAnimation: getComputedStyle(document.querySelector("h1")).animationName,
  activeAnimations: document.getAnimations().length,
}));
if (
  report.reducedMotion.heroAnimation !== "none" ||
  report.reducedMotion.activeAnimations !== 0
)
  throw new Error("Reduced motion not respected");
await writeFile("artifacts/verification.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (
  report.sizes.some((item) => item.overflow) ||
  report.accessibility.some((item) => item.violations.length)
)
  throw new Error(
    "Responsive or accessibility checks failed. See artifacts/verification.json.",
  );
