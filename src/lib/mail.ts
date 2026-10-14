import nodemailer, { type Transporter } from "nodemailer";
import { type ContactData } from "./validation";
export function mailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.CONTACT_FROM &&
    process.env.CONTACT_TO,
  );
}
export function createMailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}
export async function deliver(
  data: ContactData,
  transport: Transporter = createMailTransport(),
  envelope = { from: process.env.CONTACT_FROM!, to: process.env.CONTACT_TO! },
) {
  const result = await transport.sendMail({
    from: envelope.from,
    to: envelope.to,
    replyTo: data.email,
    subject: `Consulta web · ${data.reason}`,
    text: `Nombre: ${data.name}\nEmail: ${data.email}\nTeléfono: ${data.phone || "No indicado"}\nConsorcio y localidad: ${data.building || "No indicado"}\nMotivo: ${data.reason}\n\n${data.message}`,
  });
  if (!result.accepted?.length) throw new Error("Delivery not accepted");
}
