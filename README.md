# Bylines

**Bylines** is an experimental news site where **every article is written by
[Grok](https://x.ai)**, the large language model from xAI. There are no human
reporters and no human editors &mdash; just a small, transparent pipeline:

1. **Find the news.** For each beat (tech, US politics, world, games, sports,
   science), Grok is prompted to pick the most important, distinct stories of
   the last ~48 hours using its `x_search` and `web_search` tools.
2. **Assign a voice.** Each story is routed to one of a fixed roster of
   named "columnist" personas &mdash; a neutral wire reporter, a center-left
   explainer, a moderate-interventionist conservative, a mild both-sider, a
   features writer, an analytical tech critic.
3. **Draft and source it.** Grok writes the article in that voice (500&ndash;900
   words), with a dek, a homepage hero summary, tags, and a structured list of
   every X post and web page it cited.
4. **Publish.** The article is saved to Supabase with row-level security, and
   the public Next.js site reads straight from the database.

Every article page shows the full list of sources it leaned on, so readers can
verify (or go straight to the original posts on X).

> **Status:** early first draft. No accounts, no comments, no personalization.
> The focus right now is getting the reading experience and the pipeline's
> honesty right.

## Tech stack

| Layer       | Choice                                                         |
| ----------- | -------------------------------------------------------------- |
| Framework   | **Next.js 15** (App Router), **React 19**                      |
| Styling     | **Tailwind CSS**, light/dark mode, serif display + sans UI     |
| Database    | **Supabase Postgres** with row-level security                  |
| AI          | **xAI Responses API** (`grok-4-fast-reasoning` by default)     |
| Search      | xAI's `x_search` + `web_search` tools (live, with citations)   |
| Markdown    | `marked` + `sanitize-html` (model output is never trusted raw) |
| Icons       | `lucide-react`                                                 |
| Deployment  | Any Node.js host; designed for Vercel + Supabase               |

Grok is called with a strict JSON schema so the output we persist is already
shape-checked. Citations from tool calls are captured and merged into the
article's `sources` list.

## Running locally

Prerequisites: **Node.js 20+**, an xAI API key with `web_search` + `x_search`
tools enabled, and a Supabase project.

```bash
cp .env.example .env.local
# fill in XAI_API_KEY + SUPABASE_* values
npm install
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000). Until you seed some
articles, the home page will show an empty state with a hint to run the
generator.

### Environment variables

All variables live in `.env.local`. See [`.env.example`](./.env.example) for
the full list. Quick reference:

| Variable                          | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `XAI_API_KEY`                     | xAI key used for research + writing.                     |
| `XAI_MODEL`                       | Optional model override. Default `grok-4-fast-reasoning`. |
| `XAI_RESPONSES_URL`               | Optional override for the Responses endpoint.            |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project URL (used client-side for reads).       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anon key (RLS restricts to published articles). |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server-only; used for writes in the generator.           |
| `GENERATE_SECRET`                 | Optional shared secret for `/api/generate`.              |
| `NEXT_PUBLIC_SITE_URL`            | Used by `sitemap.xml`. Optional in dev.                  |

If `GENERATE_SECRET` is unset, the generate endpoint is open &mdash; fine for
local dev, **set it in production**.

### Database

The schema lives in [`supabase/schema.sql`](./supabase/schema.sql) and is safe
to re-apply: every statement is `if not exists` / idempotent. Two ways to
install it:

1. Paste the contents into the Supabase SQL editor and run.
2. Or, against any Postgres with the Supabase extensions available:

   ```bash
   psql "$SUPABASE_DB_URL" < supabase/schema.sql
   ```

The four tables are:

- **`topics`** &mdash; curated beat list: tech, us-politics, world, games,
  sports, science (seed rows live in the app / your own fixtures).
- **`authors`** &mdash; the named personas Grok writes as. Each has a
  `persona_prompt` spliced into the system message at write time.
- **`articles`** &mdash; the main content table. `sources` is JSON of
  `{ type: "x" | "web", url, title?, handle?, quote? }`.
- **`generation_runs`** &mdash; audit trail of every pipeline run.

Row-level security is enabled on every table. Reads are limited to
`status = 'published'`; writes only go through the service role key on the
server.

## Generating articles

There are two ways to run the pipeline:

### 1. CLI (local seeding)

```bash
# 3 articles per topic, across all topics
npm run generate -- --count=3

# Just one topic
npm run generate -- --topic=science --count=2
```

The CLI requires `XAI_API_KEY` and the Supabase service role key; it loads
`.env.local` automatically via `dotenv`.

### 2. HTTP API (cron / serverless)

```bash
curl -X POST \
  -H "Authorization: Bearer $GENERATE_SECRET" \
  "https://your-host/api/generate?count=2&topic=tech"
```

- `GET /api/generate` works too; both methods accept the same query params.
- `count` is clamped to `1..6`. Omitting `topic` runs every topic in
  sequence.
- The endpoint is `nodejs` runtime with `maxDuration = 300` &mdash; plenty of
  room for a multi-topic run on Vercel Pro, but watch your platform's limits.

### Idempotency

- Before picking stories, the generator reads the last week of titles in the
  target topic and asks Grok to avoid near-duplicates.
- `generateAll` **skips** any topic that already has the target number of
  articles in the last 24 hours, so re-running `/api/generate` on a schedule
  is cheap and safe.

### Scheduled runs

Bylines ships with a Vercel Cron config that keeps the site fresh without
bursty spikes of xAI traffic:

- [`vercel.json`](./vercel.json) calls `GET /api/generate?schedule=1` on
  `0 */2 * * *` &mdash; once every two hours, on the hour, UTC.
- In scheduled mode the endpoint picks **one** topic based on the current UTC
  slot and writes **one** article for it. With six topics on a two-hour
  cadence, every beat is serviced twice per day, roughly 12 hours apart.
- A rolling **24-hour cap of 2 articles per topic** is enforced by
  `generateOnSchedule`, so extra / manual cron hits are safe no-ops. The cap
  is tunable via `?daily_cap=N` (1&ndash;6).
- Requests from Vercel Cron are auto-authorized via the `x-vercel-cron`
  header, so the cron entry doesn't need to embed `GENERATE_SECRET`. Manual
  callers still need `Authorization: Bearer $GENERATE_SECRET` (or
  `?secret=...`) when the secret is set.

You can exercise the schedule logic locally with:

```bash
curl -X POST "http://localhost:3000/api/generate?schedule=1"
```

The response includes the topic that was picked for the current slot and how
many articles were written (`0` if the cap was already hit).

### Health check

```
GET /api/status
```

Returns `{ has_grok, has_supabase, counts, latest_published_at }` &mdash; handy
for uptime monitors and for confirming that your environment is wired up.

## Routes

| Route                    | What it is                                               |
| ------------------------ | -------------------------------------------------------- |
| `/`                      | Homepage. Lead + featured grid + per-topic sections.     |
| `/topic/[slug]`          | All articles in a beat, with a 24h / week / month switch. |
| `/article/[slug]`        | Article page with sources, tags, and related stories.    |
| `/archive`               | Everything older than 30 days, paginated and filterable. |
| `/about`                 | How Bylines works + the columnist roster.                |
| `/sitemap.xml`           | Auto-generated from Supabase.                            |
| `/api/generate`          | Kicks off a generation run (secured).                    |
| `/api/status`            | JSON health + per-topic counts.                          |

## Project layout

```
src/
  app/                Next.js App Router pages + API routes.
    page.tsx          Homepage.
    topic/[slug]      Per-topic pages with a timeframe switch.
    article/[slug]    Article detail with sources + related.
    about/            Static about page pulling live author list.
    api/generate      POST/GET entrypoint to the pipeline.
    api/status        Lightweight JSON health + counts.
    sitemap.ts        Dynamic sitemap from Supabase.
  components/         Header, footer, theme toggle, cards, rail, switch.
  lib/
    xai.ts            Thin wrapper over xAI Responses API (JSON-schema + citations).
    generator.ts      Two-phase pipeline: findTopStories -> writeArticle + orchestrators.
    articles.ts       All Supabase reads/writes for topics, authors, articles.
    authors.ts        Deterministic-but-varied author selection per topic/title.
    markdown.ts       sanitize-html + marked pipeline for Grok's Markdown.
    supabase.ts       Service + anon Supabase client factories.
    env.ts            Centralized env var access.
    types.ts          Shared Topic / Author / Article types.
    utils.ts          Small helpers (timeAgo, classNames, etc).
scripts/
  generate.ts         CLI entrypoint used by `npm run generate`.
supabase/
  schema.sql          Full database schema, idempotent.
```

## Deployment notes

- Bylines is designed to deploy to **Vercel + Supabase** with no extra
  infrastructure, but any Node 20+ host works. The generate endpoint sets
  `runtime = "nodejs"` and `maxDuration = 300` seconds.
- Set **all** env vars in your host's dashboard. `SUPABASE_SERVICE_ROLE_KEY`
  is a secret &mdash; never ship it to the client.
- `vercel.json` wires up a cron that hits `/api/generate?schedule=1` every
  two hours. Vercel's built-in cron signing is trusted automatically, so no
  additional secret wiring is needed there; manual callers still use
  `GENERATE_SECRET`.
- The `/` and `/topic/[slug]` pages are server-rendered on each request;
  `/article/[slug]` uses `revalidate = 120` (ISR) and pre-renders the 100
  most recent slugs at build time.

## Scripts

| Script                    | What it does                                           |
| ------------------------- | ------------------------------------------------------ |
| `npm run dev`             | Next.js dev server on `localhost:3000`.                |
| `npm run build`           | Production build.                                      |
| `npm run start`           | Serve a production build.                              |
| `npm run lint`            | ESLint with `eslint-config-next`.                      |
| `npm run generate -- ...` | Run the generation pipeline locally (see above).       |

## Caveats

- **AI models still hallucinate.** Every article shows its sources &mdash;
  when in doubt, trust the primary source over the article. If you spot
  something wrong, please open an issue.
- **The columnists are not real people.** They are stable personas Grok is
  prompted to write as; any byline is "Grok writing as &lt;name&gt;".
- This is a minimal first draft. Rough edges are expected.

## Roadmap ideas

- Author-level feeds and reader-followable columnists.
- A mixed-topic personal dashboard and reading queue.
- Server-sent events for live generation progress on the admin side.
- Better model-disclosure UI: "last researched at", "sources freshness", etc.
- Year-based archive drill-down (`/archive/2026` etc.) once volume warrants.

## License

MIT. See [`LICENSE`](./LICENSE).
