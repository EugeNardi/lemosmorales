import { test } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import nodemailer from "nodemailer";
import { validate, type ContactData } from "../src/lib/validation";
import { deliver } from "../src/lib/mail";
import { allowRequest } from "../src/lib/rate-limit";
import { POST } from "../src/app/api/contact/route";
const data: ContactData = {
  name: "Prueba local",
  email: "visitor@example.test",
  phone: "",
  building: "",
  reason: "Administración de consorcios",
  message: "Consulta de prueba local, sin entrega externa.",
  website: "",
  startedAt: Date.now() - 10000,
};
test("required fields, sizes, malformed email and reason are rejected", () => {
  assert.ok(
    validate({
      ...data,
      name: "",
      email: "wrong",
      message: "",
      reason: "unknown",
    }).errors.name,
  );
  assert.ok(validate({ ...data, message: "a".repeat(4001) }).errors.message);
  assert.ok(
    validate({ ...data, email: "a@example.test\r\nBcc:evil@test.com" }).errors
      .email,
  );
  assert.deepEqual(validate(data).errors, {});
});
test("rate limit expires and separates callers", () => {
  for (let i = 0; i < 5; i++)
    assert.equal(allowRequest("rate-test", 1000), true);
  assert.equal(allowRequest("rate-test", 1000), false);
  assert.equal(allowRequest("different", 1000), true);
  assert.equal(allowRequest("rate-test", 601001), true);
});
test("endpoint rejects malformed, cross-origin, large, spam and unconfigured submissions", async () => {
  const req = (body: unknown, headers = {}) =>
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  assert.equal((await POST(req("bad json"))).status, 400);
  assert.equal(
    (await POST(req(data, { origin: "https://unknown.test" }))).status,
    403,
  );
  assert.equal(
    (await POST(req({ ...data, message: "x".repeat(15000) }))).status,
    413,
  );
  assert.equal((await POST(req({ ...data, website: "spam" }))).status, 400);
  assert.equal(
    (await POST(req({ ...data, startedAt: Date.now() }))).status,
    400,
  );
  assert.equal((await POST(req({ ...data, email: "bad" }))).status, 400);
  delete process.env.SMTP_HOST;
  assert.equal((await POST(req(data))).status, 503);
});
test("local SMTP acceptance succeeds; rejection and no accepted recipients fail", async () => {
  let message = "";
  let reject = false;
  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 localhost ESMTP\r\n");
    let buffer = "";
    let receiving = false;
    socket.on("data", (chunk) => {
      buffer += chunk;
      while (buffer.includes("\r\n")) {
        const index = buffer.indexOf("\r\n");
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (receiving) {
          if (line === ".") {
            receiving = false;
            socket.write("250 Message accepted\r\n");
          } else message += line + "\r\n";
          continue;
        }
        if (line.startsWith("EHLO"))
          socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
        else if (line.startsWith("AUTH")) socket.write("235 Authenticated\r\n");
        else if (line.startsWith("MAIL")) socket.write("250 Sender OK\r\n");
        else if (line.startsWith("RCPT"))
          socket.write(
            reject ? "550 Recipient rejected\r\n" : "250 Recipient OK\r\n",
          );
        else if (line === "DATA") {
          receiving = true;
          socket.write("354 End with dot\r\n");
        } else if (line === "QUIT") {
          socket.write("221 Bye\r\n");
          socket.end();
        } else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as net.AddressInfo;
  const transport = nodemailer.createTransport({
    host: "127.0.0.1",
    port: address.port,
    ignoreTLS: true,
  });
  try {
    await deliver(data, transport, {
      from: "sender@example.test",
      to: "recipient@example.test",
    });
    assert.match(message, /Reply-To: visitor@example.test/);
    assert.match(message, /From: sender@example.test/);
    const previous = { ...process.env };
    Object.assign(process.env, {
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(address.port),
      SMTP_SECURE: "false",
      SMTP_USER: "local-test",
      SMTP_PASS: "local-test",
      CONTACT_FROM: "sender@example.test",
      CONTACT_TO: "recipient@example.test",
    });
    const request = () =>
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
    try {
      assert.equal((await POST(request())).status, 200);
      reject = true;
      assert.equal((await POST(request())).status, 502);
    } finally {
      for (const key of [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_SECURE",
        "SMTP_USER",
        "SMTP_PASS",
        "CONTACT_FROM",
        "CONTACT_TO",
      ]) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
    reject = true;
    await assert.rejects(
      deliver(data, transport, {
        from: "sender@example.test",
        to: "recipient@example.test",
      }),
    );
    const json = nodemailer.createTransport({ jsonTransport: true });
    await assert.rejects(
      deliver(data, json, {
        from: "sender@example.test",
        to: "recipient@example.test",
      }),
      /not accepted/,
    );
  } finally {
    transport.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
