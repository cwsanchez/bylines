-- Bylines schema. Apply with `psql < supabase/schema.sql` or from the
-- Supabase SQL editor. This mirrors the migrations applied via the
-- Supabase MCP during initial setup.

create table if not exists public.topics (
  slug          text primary key,
  name          text not null,
  description   text not null,
  accent        text not null default '#6366f1',
  display_order int not null default 0
);

create table if not exists public.authors (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  handle         text not null,
  bio            text not null,
  style_tag      text not null,
  persona_prompt text not null,
  avatar_hue     int  not null default 210
);

create table if not exists public.articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  topic_slug       text not null references public.topics(slug),
  author_id        uuid not null references public.authors(id),
  title            text not null,
  dek              text not null,
  body_md          text not null,
  hero_summary     text not null,
  tags             text[] not null default '{}',
  sources          jsonb  not null default '[]'::jsonb,
  reading_time_min int    not null default 3,
  model            text   not null default 'grok-4-fast-reasoning',
  status           text   not null default 'published',
  published_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists articles_topic_published_idx
  on public.articles (topic_slug, published_at desc);
create index if not exists articles_published_idx
  on public.articles (published_at desc);

create table if not exists public.generation_runs (
  id                uuid primary key default gen_random_uuid(),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  topic_slug        text,
  status            text not null default 'running',
  articles_created  int  not null default 0,
  notes             text
);

alter table public.topics          enable row level security;
alter table public.authors         enable row level security;
alter table public.articles        enable row level security;
alter table public.generation_runs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'topics readable') then
    create policy "topics readable" on public.topics for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'authors readable') then
    create policy "authors readable" on public.authors for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'published articles readable') then
    create policy "published articles readable"
      on public.articles for select using (status = 'published');
  end if;
end$$;
