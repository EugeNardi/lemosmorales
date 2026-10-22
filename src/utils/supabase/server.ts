import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";
export async function createClient(
  cookieStore?: Awaited<ReturnType<typeof cookies>>,
) {
  const store = cookieStore || (await cookies());
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Proxy refreshes cookies when a Server Component cannot write them. */
        }
      },
    },
  });
}
