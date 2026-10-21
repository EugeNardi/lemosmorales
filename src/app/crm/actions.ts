"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticated, requireAdmin, sessionCookie } from "@/lib/crm/auth";
import { authConfigured, checkPassword, makeSession } from "@/lib/crm/security";
import {
  consumeLimit,
  storageConfigured,
  statuses,
  updateInquiry,
  removeInquiry,
  type Status,
} from "@/lib/crm/store";
export async function login(
  _previous: { error: string },
  form: FormData,
): Promise<{ error: string }> {
  if (!authConfigured() || !storageConfigured())
    return { error: "El acceso todavía no está configurado." };
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (email.length > 254 || password.length > 256 || !password)
    return { error: "Revisá el correo y la contraseña." };
  try {
    const ip =
      process.env.TRUST_PROXY === "true"
        ? (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown"
        : "shared";
    if (!(await consumeLimit(`login:${ip}`, 8, 900000)))
      return {
        error:
          "Demasiados intentos. Esperá unos minutos antes de volver a ingresar.",
      };
    // Verify the hash even when the email differs to avoid a timing oracle.
    const valid = await checkPassword(password, process.env.CRM_PASSWORD_HASH!);
    if (!valid || email !== process.env.CRM_ADMIN_EMAIL?.toLowerCase())
      return { error: "El correo o la contraseña no son correctos." };
    (await cookies()).set(sessionCookie, makeSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/crm",
      maxAge: 28800,
    });
  } catch {
    return { error: "No pudimos iniciar sesión. Volvé a intentar." };
  }
  redirect("/crm");
}
export async function logout() {
  if (await authenticated())
    (await cookies()).delete({ name: sessionCookie, path: "/crm" });
  redirect("/crm/login");
}
export async function editInquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const notes = String(form.get("notes") || "");
  if (
    !/^[a-f0-9-]{36}$/.test(id) ||
    !statuses.includes(status as Status) ||
    notes.length > 5000
  )
    throw new Error("Revisá los datos de seguimiento.");
  await updateInquiry(id, status as Status, notes);
  revalidatePath("/crm");
  redirect(`/crm/${id}?saved=1`);
}
export async function deleteInquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  if (!/^[a-f0-9-]{36}$/.test(id) || form.get("confirm") !== "yes")
    throw new Error("Confirmá la eliminación.");
  await removeInquiry(id);
  revalidatePath("/crm");
  redirect("/crm");
}
