# Bylines

Bylines is an experimental news site where **every article is written by
Grok**, the large language model from xAI. There are no human reporters and no
human editors. A small pipeline:

1. Picks the most important, distinct stories in each beat (tech, US
   politics, world, games, sports, science) using Grok's `x_search` and
   `web_search` tools.
2. Assigns each story to a named "columnist" persona – neutral wire reporter,
   center-left explainer, moderate-interventionist conservative, a mild
   both-sider, a features writer, an analytical tech critic – and asks Grok
   to draft the article in that voice.
3. Saves the article, a dek, a hero summary, tags, and a full list of X-post
   and web sources to Supabase.

The site you browse is a plain Next.js app that reads from that Supabase
database. Articles list every source they leaned on, so readers can verify
(or go straight to the original posts on X).

## Tech stack

- **Next.js 15 (App Router), React 19, Tailwind CSS** for the reading
  experience. Light and dark mode, serif display type, sans for UI.
- **Supabase Postgres** (`topics`, `authors`, `articles`,
  `generation_runs`) with RLS that only exposes published articles to the
  public.
- **xAI Responses API** (`grok-4-fast-reasoning` by default) with
  `x_search` and `web_search` tools and strict JSON-schema output.
- **sanitize-html + marked** for rendering Grok's Markdown safely.

There is no user system yet, by design – this is the "first draft" of the
site, focused on getting the reading experience right.

## Running locally

```bash
cp .env.example .env.local
# fill in XAI_API_KEY + SUPABASE_* values
npm install
npm run dev
```

Open `http://localhost:3000`. Until you seed some articles, the home page
will show an empty state.

## Seeding / generating articles

There are two ways to run the pipeline:

1. **Via the CLI** (great for local seeding):

   ```bash
   # 3 articles per topic, across all topics
   npm run generate -- --count=3

   # Just one topic
   npm run generate -- --topic=science --count=2
   ```

2. **Via the API** (great for cron / scheduled jobs):

   ```bash
   curl -X POST \
     -H "Authorization: Bearer $GENERATE_SECRET" \
     "https://your-host/api/generate?count=2&topic=tech"
   ```

   `GET /api/status` returns counts per topic and the timestamp of the most
   recently published article – handy for a health check.

The generator is idempotent-ish: before running, it looks at the last
week's titles and asks Grok to avoid duplicates. `generateAll` also skips
any topic that already has the target number of articles in the last 24
hours, so running the endpoint multiple times a day is safe and cheap.

## Database

The schema lives in Supabase and was applied via the MCP migrations in
`supabase_migrations` (Supabase project: `pulse-news` /
`vrjwtnrwktckrawdanra`). The four tables are:

- `topics` – curated beat list: tech, us-politics, world, games, sports,
  science.
- `authors` – the set of named personas Grok writes as. Each has a
  `persona_prompt` that is spliced into the system message at write time.
- `articles` – the main content table. `sources` is JSON of `{type: "x" |
  "web", url, title?, handle?, quote?}`.
- `generation_runs` – audit trail of every pipeline run.

Row-level security is enabled on all tables. Reads are limited to published
articles; writes only go through the service role key on the server.

## Layout

- `src/app` – Next.js App Router. Home (`/`), topic pages
  (`/topic/[slug]`), articles (`/article/[slug]`), the about page, and two
  API routes under `/api`.
- `src/components` – the site header, footer, theme toggle, article card,
  timeframe switch, topic rail, author avatar.
- `src/lib/xai.ts` – a thin wrapper around the xAI Responses API with
  strict JSON-schema output and citation extraction.
- `src/lib/generator.ts` – the two-phase generation pipeline
  (`findTopStories` → `writeArticle`) and `generateForTopic` /
  `generateAll` orchestrators.
- `src/lib/articles.ts` – all Supabase access for reads + writes.
- `scripts/generate.ts` – CLI entrypoint used by `npm run generate`.

## Notes / caveats

- AI models can still hallucinate. Every article shows its sources; when in
  doubt, trust the primary source over the article. If you spot something
  wrong, please open an issue.
- This is a minimal first draft. Future ideas: author-level feeds, mixed
  topic dashboards, a personal reading queue, server-sent events for live
  generation progress, and a scheduled cron that keeps each beat fresh
  every few hours.

## License

MIT. See `LICENSE`.
