import { test } from "node:test";
import assert from "node:assert/strict";
import { whatsappUrl, whatsappMessage } from "../src/lib/contact-links";
test("WhatsApp opens the confirmed number with the exact message encoded", () => {
  const url = new URL(whatsappUrl("5493515154142")!);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/5493515154142");
  assert.equal(url.searchParams.get("text"), whatsappMessage);
  assert.equal(whatsappUrl(null), null);
  assert.equal(whatsappUrl("javascript:alert(1)"), null);
});
