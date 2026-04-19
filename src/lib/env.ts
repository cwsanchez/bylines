/**
 * Centralized environment access so we fail loudly & consistently when a
 * secret is missing, and so tests can mock a single module.
 */

export const env = {
  X_BEARER_TOKEN: process.env.X_BEARER_TOKEN ?? "",
  XAI_API_KEY: process.env.XAI_API_KEY ?? "",
  XAI_MODEL: process.env.XAI_MODEL ?? "grok-4-1-fast-reasoning",
  SUPABASE_URL:
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  /** Cache TTL for section feeds, in minutes. */
  CACHE_TTL_MINUTES: Number(process.env.CACHE_TTL_MINUTES ?? 20),
};

/** Force demo mode regardless of credentials (used for deterministic E2E). */
export function forceDemo(): boolean {
  return (
    process.env.FORCE_DEMO === "1" ||
    process.env.NEXT_PUBLIC_FORCE_DEMO === "1"
  );
}

export function hasXCredentials(): boolean {
  if (forceDemo()) return false;
  return Boolean(env.X_BEARER_TOKEN);
}

export function hasGrokCredentials(): boolean {
  return Boolean(env.XAI_API_KEY);
}

export function hasSupabaseCredentials(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isDemoMode(): boolean {
  return !hasXCredentials();
}
