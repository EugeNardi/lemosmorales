import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "./security";
export const sessionCookie = "lm_crm_session";
export async function authenticated() {
  return readSession((await cookies()).get(sessionCookie)?.value);
}
export async function requireAdmin() {
  if (!(await authenticated())) redirect("/crm/login");
}
