import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getWebConfig } from "./config.ts";

let browserClient: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  const config = getWebConfig();
  if (!config.isBackendConfigured) {
    throw new Error("Supabase is not configured. Demo mode is active.");
  }

  browserClient ??= createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export function resetBrowserSupabaseForTests() {
  browserClient = undefined;
}

export function clearSupabaseAuthStorage(storage: Pick<Storage, "length" | "key" | "removeItem"> = window.localStorage) {
  const keys = Array.from({ length: storage.length }, (_value, index) => storage.key(index)).filter((key): key is string =>
    Boolean(key),
  );
  for (const key of keys) {
    if (key.startsWith("sb-") || key === "supabase.auth.token") {
      storage.removeItem(key);
    }
  }
  browserClient = undefined;
}
