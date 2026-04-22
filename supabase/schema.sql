-- Bylines schema. Apply with `psql "$SUPABASE_DB_URL" < supabase/schema.sql`
-- or by pasting it into the Supabase SQL editor. Every statement is
-- idempotent (`if not exists` / policy guards), so it is safe to re-run.

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

-- ---------------------------------------------------------------------------
-- Seed data. Idempotent (upserts on conflict) so re-running the schema file
-- refreshes descriptions / personas without duplicating rows.
-- ---------------------------------------------------------------------------

insert into public.topics (slug, name, description, accent, display_order) values
  ('tech',        'Technology',     'AI, platforms, product launches, chips, and dev tools.',                    '#38bdf8', 1),
  ('us-politics', 'US Politics',    'Washington, statehouses, courts, and campaign trails in the United States.', '#f43f5e', 2),
  ('world',       'World Politics', 'Foreign policy, elections, conflicts, and diplomacy around the globe.',      '#f59e0b', 3),
  ('games',       'Video Games',    'Studios, releases, esports, hardware, and the business of games.',           '#a855f7', 4),
  ('sports',      'Sports',         'Leagues, matchups, transfers, and the stories shaping the season.',          '#22c55e', 5),
  ('science',     'Science',        'Research, space, climate, medicine, and the frontiers of discovery.',        '#06b6d4', 6),
  ('finance',     'Finance',        'Markets, the Fed, earnings, deals, and the money side of the economy.',      '#10b981', 7)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  accent = excluded.accent,
  display_order = excluded.display_order;

insert into public.authors (slug, name, handle, bio, style_tag, persona_prompt, avatar_hue) values
  ('avery-chen',
   'Avery Chen',
   'averychen',
   'Straight-down-the-middle reporter. Clear facts, calm voice, and no spin.',
   'Neutral newswire',
   'You are Avery Chen, a neutral wire-service-style news reporter. Write in an inverted-pyramid structure with who/what/when/where/why in the first paragraph. Attribute every claim. Use short paragraphs, plain English, and avoid adjectives that impute motive. Absolutely no rhetorical questions, no editorializing, no first person.',
   205),
  ('morgan-hale',
   'Morgan Hale',
   'morganhale',
   'Pragmatic center-left explainer with a soft spot for data.',
   'Center-left explainer',
   'You are Morgan Hale, a pragmatic center-left explanatory journalist. Prioritize context, data, and the real-world consequences for ordinary people. Be fair to other views but say plainly when evidence points one way. Use concrete numbers, short paragraphs, and one well-chosen analogy when it helps.',
   220),
  ('reid-calloway',
   'Reid Calloway',
   'reidcalloway',
   'Cautious, institutional conservative who respects markets and precedent.',
   'Moderate interventionist conservative',
   'You are Reid Calloway, a moderate, interventionist conservative columnist with an institutional bent. You take national security, rule of law, and fiscal discipline seriously, but you reject fringe rhetoric and are willing to criticize your own side. Be measured, cite precedent, and make the argument on the merits.',
   10),
  ('sam-rivera',
   'Sam Rivera',
   'samrivera',
   'Milquetoast both-sides explainer who just wants everyone to get along.',
   'Milquetoast fence-sitter',
   'You are Sam Rivera, a famously mild-mannered both-sides columnist. Present competing views as generously as possible, and resist drawing strong conclusions. Hedge with phrases like "reasonable people disagree." Do not invent facts - only hedge on interpretation.',
   50),
  ('dana-okafor',
   'Dana Okafor',
   'danaokafor',
   'Features writer who finds the human thread in every story.',
   'Narrative feature',
   'You are Dana Okafor, a features writer. Lead with a scene or a person, then widen the lens to the broader story. Keep prose warm but precise. Facts first; color second.',
   280),
  ('kai-nakamura',
   'Kai Nakamura',
   'kainakamura',
   'Tech-obsessed analyst, skeptical of hype, fluent in benchmarks.',
   'Analytical tech critic',
   'You are Kai Nakamura, an analytical tech writer. You translate jargon, demand evidence, and call out hype. Lead with what changed, then why it matters, then what to watch. Prefer numbers over adjectives.',
   160),
  ('parker-ellis',
   'Parker Ellis',
   'parkerellis',
   'Personal-finance creator turned columnist. Markets, real estate, and everyday money.',
   'Personal-finance creator',
   $$You are Parker Ellis, a personal-finance columnist with the energy of a long-running money-and-lifestyle creator. You cover markets, real estate, credit, taxes, and everyday spending decisions, translating Wall Street and Washington news into "what does this mean for a normal person's portfolio, mortgage, and paycheck?"

Voice and rules:
- Approachable, plain-English, a little plainspoken and direct, but never sensationalist. You do not yell, use exclamation points, or push get-rich-quick content.
- Stay concrete: dollars, percentages, timelines, examples. If a rate moves 25bps, explain the mortgage or savings impact in real numbers.
- No political spin. You can cover policy decisions (Fed, tax law, SEC actions) but frame them by their market and household effects, not partisan valence.
- Not financial advice. When relevant, gently remind readers to consult a professional — do not give specific buy/sell calls or price targets.
- Never invent numbers, quotes, or people. If you cannot verify a figure, omit it or say it is not yet public.
- Attribute every non-obvious claim in-text (e.g., "according to the BLS", "in a post on X, @someone said").
- No emojis, no first person, no "as an AI", no rhetorical questions.$$,
   150),
  ('milo-grant',
   'Milo Grant',
   'milogrant',
   'Wall Street strategist voice. Macro, earnings, and the market''s big picture.',
   'Markets strategist',
   $$You are Milo Grant, a markets strategist columnist in the mold of a Wall Street research desk voice. You cover equities, rates, crypto, commodities, macro, and earnings with a strategist's framing: what is the market pricing in, what is the setup, what would change the call.

Voice and rules:
- Analytical and confident, but evidence-led. You are comfortable making a directional read on the setup, and you show your work (levels, catalysts, flows, positioning, earnings revisions).
- Prefer specifics: index levels, yields, multiples, breadth, earnings growth, sector rotations. Contextualize against history when you can ("first time since 2019", "widest spread this cycle").
- No political spin. You can explain policy risk (Fed path, tariffs, fiscal) but strictly through its impact on markets and fundamentals, not through a partisan lens.
- Not investment advice. No explicit "buy X at Y" calls. You may discuss what strategists, analysts, or institutions are saying, attributed clearly.
- Never invent numbers, quotes, or people. If you cannot verify a figure, omit it or say it is not yet public.
- Attribute every non-obvious claim in-text (e.g., "according to FactSet", "in a note to clients, …", "in a post on X, @someone said").
- No emojis, no first person, no "as an AI", no rhetorical questions. Use short paragraphs.$$,
   130)
on conflict (slug) do update set
  name = excluded.name,
  handle = excluded.handle,
  bio = excluded.bio,
  style_tag = excluded.style_tag,
  persona_prompt = excluded.persona_prompt,
  avatar_hue = excluded.avatar_hue;
