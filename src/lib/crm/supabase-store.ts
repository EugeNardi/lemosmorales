import { randomUUID } from "node:crypto";
import { createClient as createApiClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
import type { ContactData } from "../validation";
import type { Inquiry, Status } from "./store";

function publicClient() {
  const { url, key } = supabaseConfig();
  return createApiClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export class SubmissionError extends Error {
  constructor(public readonly rateLimited: boolean) {
    super(rateLimited ? "rate_limited" : "submission_unavailable");
  }
}
export async function submitInquiry(data: ContactData) {
  const supabase = publicClient();
  const { data: result, error } = await supabase.rpc("crm_submit_inquiry", {
    p_id: randomUUID(),
    p_name: data.name,
    p_email: data.email,
    p_phone: data.phone,
    p_building: data.building,
    p_reason: data.reason,
    p_message: data.message,
    p_started_at: data.startedAt,
    p_website: data.website,
  });
  if (error)
    throw new SubmissionError(error.message.includes("crm_rate_limit"));
  if (typeof result !== "string") throw new SubmissionError(false);
  return result;
}
export async function queryInquiries({
  search = "",
  status = "",
  page = 1,
}: { search?: string; status?: string; page?: number } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crm_list_inquiries", {
    p_search: search.slice(0, 200),
    p_status: status,
    p_page: Math.max(1, Math.min(Math.trunc(page) || 1, 100000)),
  });
  if (error) throw new Error("No pudimos cargar las consultas.");
  return data as {
    rows: Inquiry[];
    total: number;
    counts: { status: Status; total: number }[];
  };
}
export async function queryInquiry(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No pudimos cargar la consulta.");
  return data as Inquiry | null;
}
export async function changeInquiry(id: string, status: Status, notes: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_inquiries")
    .update({ status, notes })
    .eq("id", id);
  if (error) throw new Error("No pudimos guardar el seguimiento.");
}
export async function deleteStoredInquiry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_inquiries").delete().eq("id", id);
  if (error) throw new Error("No pudimos eliminar la consulta.");
}
export async function trackNotification(id: string, state: "sent" | "failed") {
  // A publishable key must never be given anonymous UPDATE privileges.
  // Notification tracking is optional and requires a server-only elevated key.
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return;
  const { url } = supabaseConfig();
  const client = createApiClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client
    .from("crm_inquiries")
    .update({ notification: state })
    .eq("id", id);
  if (error) throw new Error("No pudimos actualizar la notificación.");
}
