"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticated, requireAdmin, sessionCookie } from "@/lib/crm/auth";
import { authConfigured, checkPassword, makeSession } from "@/lib/crm/security";
import { supabaseCrm } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
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
  if (supabaseCrm()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user)
        return {
          error:
            error?.status === 429
              ? "Demasiados intentos. Esperá unos minutos."
              : "El correo o la contraseña no son correctos.",
        };
      const access = await supabase.rpc("crm_is_admin");
      if (access.error || access.data !== true) {
        await supabase.auth.signOut();
        return {
          error:
            "Tu usuario todavía no tiene acceso al panel. Revisá la configuración del administrador.",
        };
      }
    } catch {
      return { error: "No pudimos conectar con el acceso. Volvé a intentar." };
    }
    redirect("/consultas");
  }
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
      path: "/consultas",
      maxAge: 28800,
    });
  } catch {
    return { error: "No pudimos iniciar sesión. Volvé a intentar." };
  }
  redirect("/consultas");
}
export async function logout() {
  if (supabaseCrm()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/consultas");
  }
  if (await authenticated())
    (await cookies()).delete({ name: sessionCookie, path: "/consultas" });
  redirect("/consultas/login");
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
  revalidatePath("/consultas");
  redirect(`/consultas/${id}?saved=1`);
}
export async function deleteInquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  if (!/^[a-f0-9-]{36}$/.test(id) || form.get("confirm") !== "yes")
    throw new Error("Confirmá la eliminación.");
  await removeInquiry(id);
  revalidatePath("/consultas");
  redirect("/consultas");
}
