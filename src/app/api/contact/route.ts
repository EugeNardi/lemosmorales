import { validate } from "@/lib/validation";
import { createMailTransport, deliver, mailConfigured } from "@/lib/mail";
import { allowRequest } from "@/lib/rate-limit";
import { supabaseCrm } from "@/utils/supabase/config";
import { SubmissionError } from "@/lib/crm/supabase-store";
import {
  storageConfigured,
  saveInquiry,
  setNotification,
  consumeLimit,
} from "@/lib/crm/store";
export const runtime = "nodejs";
const reply = (message: string, status: number, extra = {}) =>
  Response.json(
    { message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  // Next's internal URL can use localhost while the browser uses 127.0.0.1.
  // Host is the actual request host; do not trust forwarded headers here.
  const hostOrigin = request.headers.get("host")
    ? `${requestUrl.protocol}//${request.headers.get("host")}`
    : requestUrl.origin;
  if (
    origin &&
    origin !== requestUrl.origin &&
    origin !== hostOrigin &&
    origin !== process.env.NEXT_PUBLIC_SITE_URL
  )
    return reply("Solicitud no permitida.", 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply("Formato no permitido.", 415);
  if (Number(request.headers.get("content-length")) > 14000)
    return reply("La consulta es demasiado extensa.", 413);
  const reader = request.body?.getReader();
  if (!reader) return reply("Faltan los datos.", 400);
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 14000) {
        await reader.cancel();
        return reply("La consulta es demasiado extensa.", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return reply("No pudimos leer la consulta.", 400);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return reply("Revisá los datos de la consulta.", 400);
  }
  const checked = validate(raw);
  if (!checked.data)
    return reply("Revisá los campos indicados.", 400, {
      errors: checked.errors,
    });
  const data = checked.data;
  if (
    data.website ||
    Date.now() - data.startedAt < 2000 ||
    data.startedAt > Date.now()
  )
    return reply(
      "No pudimos validar la consulta. Esperá unos segundos e intentá de nuevo.",
      400,
    );
  const identity =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "single-instance";
  let allowed: boolean;
  try {
    allowed = supabaseCrm()
      ? allowRequest(identity)
      : storageConfigured()
        ? await consumeLimit(`contact:${identity}`)
        : allowRequest(identity);
  } catch {
    return reply(
      "No pudimos registrar tu consulta. Podés escribirnos por email o WhatsApp.",
      503,
    );
  }
  if (!allowed)
    return reply(
      "Recibimos varios intentos. Esperá unos minutos antes de volver a enviar.",
      429,
    );
  if (storageConfigured()) {
    let id: string;
    try {
      id = await saveInquiry(data);
    } catch (error) {
      if (error instanceof SubmissionError && error.rateLimited)
        return reply(
          "Recibimos varios intentos. Esperá unos minutos antes de volver a enviar.",
          429,
        );
      return reply(
        "No pudimos registrar tu consulta. Conservamos los datos para que puedas reintentar.",
        503,
      );
    }
    // A notification failure must not ask the visitor to submit an accepted inquiry again.
    if (mailConfigured()) {
      let notification: "sent" | "failed" = "failed";
      try {
        await deliver(data, createMailTransport());
        notification = "sent";
      } catch {
        /* Persisted in CRM. */
      }
      try {
        await setNotification(id, notification);
      } catch {
        /* Do not duplicate an accepted inquiry. */
      }
    }
    return reply(
      "Tu consulta fue enviada con éxito. Gracias por escribirnos.",
      200,
    );
  }
  if (!mailConfigured())
    return reply(
      "El envío de consultas todavía no está habilitado. Tus datos no fueron enviados.",
      503,
    );
  try {
    await deliver(data, createMailTransport());
    return reply(
      "Tu consulta fue enviada con éxito. Gracias por escribirnos.",
      200,
    );
  } catch {
    return reply(
      "No pudimos enviar tu consulta. Conservamos lo que escribiste para que puedas reintentar.",
      502,
    );
  }
}
