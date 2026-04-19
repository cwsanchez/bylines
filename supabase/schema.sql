-- Pulse schema. Apply with `psql < supabase/schema.sql` or from the Supabase SQL editor.
--
-- Data model:
--   * posts      — the latest curated "best of" set per (section_id, timeframe).
--                  Written after each scheduled refresh; read on every page load.
--   * summaries  — the Grok editorial briefing for each (section_id, timeframe).
--   * archive    — every curated post ever seen, deduped by tweet id. This lets
--                  longer windows (week, month) keep historical stories visible
--                  even after X's 7-day recent-search limit.

create table if not exists public.posts (
  section_id   text not null,
  timeframe    text not null,
  data         jsonb not null,
  updated_at   timestamptz not null default now(),
  primary key (section_id, timeframe)
);

create table if not exists public.summaries (
  section_id   text not null,
  timeframe    text not null,
  input_hash   text not null,
  data         jsonb not null,
  updated_at   timestamptz not null default now(),
  primary key (section_id, timeframe)
);

create table if not exists public.archive (
  section_id    text not null,
  tweet_id      text not null,
  created_at    timestamptz not null,
  data          jsonb not null,
  first_seen_at timestamptz not null default now(),
  primary key (section_id, tweet_id)
);

create index if not exists posts_updated_at_idx
  on public.posts (updated_at desc);

create index if not exists summaries_updated_at_idx
  on public.summaries (updated_at desc);

create index if not exists archive_section_created_idx
  on public.archive (section_id, created_at desc);

-- Row-level security: all Pulse tables are only accessed by the service role
-- from the Next.js server. Keep RLS enabled and deny-by-default.
alter table public.posts enable row level security;
alter table public.summaries enable row level security;
alter table public.archive enable row level security;
