/**
 * Centralized environment access. Fails loudly & consistently when a secret
 * is missing, and gives the rest of the app a single module to mock.
 */
export const env = {
  XAI_API_KEY: process.env.XAI_API_KEY ?? "",
  XAI_MODEL: process.env.XAI_MODEL ?? "grok-4-fast-reasoning",
  XAI_RESPONSES_URL:
    process.env.XAI_RESPONSES_URL ?? "https://api.x.ai/v1/responses",

  SUPABASE_URL:
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",

  /** Shared secret required to trigger /api/generate from a cron / CLI. */
  GENERATE_SECRET: process.env.GENERATE_SECRET ?? "",
};

export function hasGrok(): boolean {
  return Boolean(env.XAI_API_KEY);
}

export function hasSupabase(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
