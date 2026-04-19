import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseCredentials } from "./env";

let _client: SupabaseClient | null = null;

/**
 * Returns a service-role Supabase client for server-side operations.
 * If Supabase credentials aren't configured, returns null and callers
 * should gracefully fall back to in-memory behaviour.
 */
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseCredentials()) return null;
  if (_client) return _client;
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
