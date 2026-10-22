import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "./security";
import { cache } from "react";
import { supabaseCrm, supabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
export const sessionCookie = "lm_crm_session";
export const authenticated = cache(async function authenticated() {
  if (supabaseCrm()) {
    if (!supabaseConfigured()) return false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return false;
      const result = await supabase.rpc("crm_is_admin");
      return !result.error && result.data === true;
    } catch {
      return false;
    }
  }
  return readSession((await cookies()).get(sessionCookie)?.value);
});
export async function requireAdmin() {
  if (!(await authenticated())) redirect("/consultas/login");
}
