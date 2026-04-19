-- Pulse schema. Apply with `psql < supabase/schema.sql` or from the Supabase SQL editor.
--
-- We keep everything in two tables because the data naturally lives as
-- versioned JSON snapshots per (section, timeframe) pair. If you want to do
-- cross-section queries, expand into relational tables later - the service
-- layer is the single point to change.

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

create index if not exists posts_updated_at_idx
  on public.posts (updated_at desc);

create index if not exists summaries_updated_at_idx
  on public.summaries (updated_at desc);

-- Row-level security: both tables are only accessed by the service role
-- from the Next.js server. Keep RLS enabled and deny-by-default.
alter table public.posts enable row level security;
alter table public.summaries enable row level security;
