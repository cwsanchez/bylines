import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "./env";

let _serviceClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

/**
 * Service-role client for server-side writes. Returns null if Supabase is
 * not configured, so callers can fall back gracefully.
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (_serviceClient) return _serviceClient;
  _serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}

/**
 * Anon client for reads from any (server or client) context. Uses the public
 * URL + anon key and relies on RLS to restrict access to published content.
 */
export function getAnonSupabase(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  if (_anonClient) return _anonClient;
  _anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _anonClient;
}
