import { callGrokJSON, GrokError } from "./xai";
import {
  countRecentArticles,
  insertArticle,
  listArticles,
  listAuthors,
  listTopics,
} from "./articles";
import { pickAuthor } from "./authors";
import { env, hasGrok, hasSupabase } from "./env";
import { getServiceSupabase } from "./supabase";
import type { Author, Topic } from "./types";

export interface StoryCandidate {
  title: string;
  angle: string;
  why_it_matters: string;
  search_query: string;
  tags: string[];
}

interface StoriesJSON {
  stories: StoryCandidate[];
}

interface ArticleJSON {
  title: string;
  dek: string;
  body_md: string;
  hero_summary: string;
  tags: string[];
  sources: Array<{
    type: "x" | "web";
    url: string;
    title?: string;
    handle?: string;
    quote?: string;
  }>;
}

interface GenerateOptions {
  topicSlug: string;
  count: number;
  /** Optional title pool to avoid collisions on. */
  avoidTitles?: string[];
  signal?: AbortSignal;
}

const STORIES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["stories"],
  properties: {
    stories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "angle", "why_it_matters", "search_query", "tags"],
        properties: {
          title: { type: "string" },
          angle: { type: "string" },
          why_it_matters: { type: "string" },
          search_query: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "dek",
    "body_md",
    "hero_summary",
    "tags",
    "sources",
  ],
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    body_md: { type: "string" },
    hero_summary: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "url"],
        properties: {
          type: { type: "string", enum: ["x", "web"] },
          url: { type: "string" },
          title: { type: "string" },
          handle: { type: "string" },
          quote: { type: "string" },
        },
      },
    },
  },
};

function isoNow(): string {
  return new Date().toISOString();
}

function isoHoursAgo(hours: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - hours);
  return d.toISOString();
}

export async function findTopStories(
  topic: Topic,
  count: number,
  avoidTitles: string[],
  signal?: AbortSignal,
): Promise<{ stories: StoryCandidate[]; citations: { url: string }[] }> {
  const avoidBlock = avoidTitles.length
    ? `\nDo NOT suggest stories that overlap with any of these recently-covered headlines:\n- ${avoidTitles
        .slice(0, 30)
        .map((t) => t.replace(/\n/g, " "))
        .join("\n- ")}`
    : "";

  const instructions = `You are the news desk editor for a site whose only writer is the Grok AI model. Your job: pick the ${count} most important, distinct stories in the "${topic.name}" beat from the past 48 hours.

Hard rules:
- Each story must be genuinely newsworthy and distinct (no duplicates, no near-duplicates).
- Skip gossip, memes, pure rumor, and pure opinion takes.
- Prefer verifiable, reported events: launches, filings, votes, results, discoveries, incidents.
- "search_query" should be a focused query a human could paste into X or Google to learn more.
- Return ONLY the JSON specified by the schema.`;

  const input = `Today is ${isoNow()}.
Topic: ${topic.name} — ${topic.description}

Use the x_search and web_search tools aggressively. Look at X (the social network formerly known as Twitter) and the open web. Consider posts from reputable outlets and official accounts.

Return the ${count} best stories in this beat from the last ~48 hours, most important first.${avoidBlock}`;

  const res = await callGrokJSON<StoriesJSON>({
    instructions,
    input,
    jsonSchema: { name: "topic_stories", schema: STORIES_SCHEMA, strict: true },
    xSearch: { from_date: isoHoursAgo(72).slice(0, 10) },
    signal,
  });

  const stories = (res.data?.stories ?? [])
    .filter((s) => s.title && s.angle)
    .slice(0, count);
  return { stories, citations: res.citations };
}

/** Strip Grok's inline citation XML and other stray markup so the body renders cleanly. */
function cleanBody(md: string): string {
  let out = md;
  // Remove xAI's custom inline citation tags: <grok:render>...</grok:render>
  out = out.replace(/<grok:render[\s\S]*?<\/grok:render>/gi, "");
  // Strip other raw XML-ish tags Grok sometimes emits.
  out = out.replace(/<argument[^>]*>[\s\S]*?<\/argument>/gi, "");
  // Collapse whitespace created by removals.
  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

export async function writeArticle(
  topic: Topic,
  author: Author,
  story: StoryCandidate,
  signal?: AbortSignal,
): Promise<{ article: ArticleJSON; citations: { url: string }[] }> {
  const instructions = `${author.persona_prompt}

You are writing for Bylines, a clean, modern news site. Your voice is "${author.style_tag}". You are writing the article with byline "${author.name}" (@${author.handle}).

Output contract:
- "title": 6-12 words, specific, no clickbait, Title Case or sentence case (whichever the outlet style demands for this type of story).
- "dek": a 1-sentence subhead (15-28 words) that adds context the title doesn't already provide.
- "body_md": well-structured Markdown, 500-900 words. Use short paragraphs. You MAY use ## subheadings for longer pieces. NO links, NO footnote markers, NO <grok:render> tags, NO <argument> tags, NO [1] or [^1] style citation markers anywhere in the body. Sources go in the "sources" array, not inline. No images.
- "hero_summary": 2-3 plain sentences (<= 55 words total) that someone glancing at the homepage would read as a standalone summary. Do not repeat the title verbatim.
- "tags": 3-5 lowercase kebab-case tags.
- "sources": 3-8 entries. Include BOTH X posts ("type":"x") and web articles ("type":"web") where possible. For X sources, include the poster's handle. Pull direct, short (<=160 char) quotes into "quote" when helpful. The "url" MUST come from citations produced by your search tools - never invent URLs.

Journalism rules:
- Never invent facts, numbers, quotes, or people. If you cannot verify, omit.
- Attribute every non-obvious claim in-text (e.g., "according to Reuters", "in a post on X, @someone said").
- Do not editorialize except in the specific style tag above.
- No emojis. No first person. No "as an AI".`;

  const input = `Story brief from the editor:

TITLE SUGGESTION: ${story.title}
ANGLE: ${story.angle}
WHY IT MATTERS: ${story.why_it_matters}
SEARCH QUERY TO START WITH: ${story.search_query}
TAG IDEAS: ${story.tags.join(", ")}

Today: ${isoNow()}
Topic: ${topic.name}

Use the x_search and web_search tools to research this story thoroughly before writing. Cross-check at least 2 independent sources. Once you have the facts, write the article. Return ONLY the JSON in the schema.`;

  const res = await callGrokJSON<ArticleJSON>({
    instructions,
    input,
    jsonSchema: { name: "article", schema: ARTICLE_SCHEMA, strict: true },
    xSearch: { from_date: isoHoursAgo(168).slice(0, 10) },
    signal,
  });

  const cleaned: ArticleJSON = {
    ...res.data,
    body_md: cleanBody(res.data.body_md || ""),
    hero_summary: cleanBody(res.data.hero_summary || ""),
    dek: cleanBody(res.data.dek || ""),
  };
  return { article: cleaned, citations: res.citations };
}

export interface GeneratedSummary {
  topic: string;
  attempted: number;
  created: number;
  skipped: string[];
  errors: string[];
}

export async function generateForTopic(
  opts: GenerateOptions,
): Promise<GeneratedSummary> {
  if (!hasGrok()) {
    throw new GrokError("XAI_API_KEY is not configured", 500);
  }
  if (!hasSupabase()) {
    throw new GrokError("Supabase is not configured", 500);
  }

  const topics = await listTopics();
  const topic = topics.find((t) => t.slug === opts.topicSlug);
  if (!topic) {
    throw new GrokError(`Unknown topic ${opts.topicSlug}`, 400);
  }

  const authors = await listAuthors();
  const recent = await listArticles({
    topicSlug: topic.slug,
    timeframe: "week",
    limit: 40,
  });
  const avoidTitles = [
    ...(opts.avoidTitles ?? []),
    ...recent.map((a) => a.title),
  ];

  const supa = getServiceSupabase();
  const runInsert = supa
    ? await supa
        .from("generation_runs")
        .insert({
          topic_slug: topic.slug,
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single()
    : null;
  const runId = runInsert?.data?.id as string | undefined;

  const summary: GeneratedSummary = {
    topic: topic.slug,
    attempted: 0,
    created: 0,
    skipped: [],
    errors: [],
  };

  try {
    const { stories } = await findTopStories(
      topic,
      opts.count,
      avoidTitles,
      opts.signal,
    );
    summary.attempted = stories.length;

    for (const story of stories) {
      const author = pickAuthor(topic.slug, story.title, authors);
      try {
        const { article, citations } = await writeArticle(
          topic,
          author,
          story,
          opts.signal,
        );
        const sources = (article.sources ?? []).filter((s) => s.url);
        if (sources.length < 2 && citations.length >= 2) {
          for (const c of citations.slice(0, 4)) {
            if (!sources.find((s) => s.url === c.url)) {
              sources.push({ type: "web", url: c.url });
            }
          }
        }
        const inserted = await insertArticle({
          topic_slug: topic.slug,
          author_id: author.id,
          title: article.title,
          dek: article.dek,
          body_md: article.body_md,
          hero_summary: article.hero_summary,
          tags: article.tags ?? [],
          sources,
          reading_time_min: 0,
          model: env.XAI_MODEL,
        });
        if (inserted) summary.created += 1;
        else summary.skipped.push(article.title);
      } catch (err) {
        summary.errors.push(
          `${story.title}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  } finally {
    if (supa && runId) {
      await supa
        .from("generation_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: summary.errors.length ? "partial" : "ok",
          articles_created: summary.created,
          notes: summary.errors.join(" | ").slice(0, 2000) || null,
        })
        .eq("id", runId);
    }
  }

  return summary;
}

export async function generateAll(
  countPerTopic = 3,
  signal?: AbortSignal,
): Promise<GeneratedSummary[]> {
  const topics = await listTopics();
  const out: GeneratedSummary[] = [];
  for (const topic of topics) {
    // Cap generation if topic already has plenty of fresh content.
    const fresh = await countRecentArticles(topic.slug, 24);
    const need = Math.max(0, countPerTopic - fresh);
    if (need === 0) {
      out.push({
        topic: topic.slug,
        attempted: 0,
        created: 0,
        skipped: [],
        errors: [],
      });
      continue;
    }
    const result = await generateForTopic({
      topicSlug: topic.slug,
      count: need,
      signal,
    });
    out.push(result);
  }
  return out;
}

/**
 * Pick which topic a given cron tick should service.
 *
 * The site runs one cron tick every `slotHours` hours (default 4). Across a
 * 24h day that yields `24 / slotHours` slots. We cycle through topics by slot
 * so that every topic gets the same number of runs per day, spaced as far
 * apart as possible. With 6 topics on a 4h cadence, each topic gets one run
 * per day, 24 hours apart — a natural 1-per-topic-per-day throughput that
 * still comfortably fits under the rolling 24h cap of 2 articles/topic.
 */
export function pickTopicForSlot(
  topics: Topic[],
  now: Date = new Date(),
  slotHours = 4,
): Topic | null {
  if (topics.length === 0) return null;
  const slot = Math.floor(now.getUTCHours() / slotHours);
  const sorted = [...topics].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.slug.localeCompare(b.slug);
  });
  return sorted[slot % sorted.length];
}

export interface ScheduleOptions {
  /** Max articles per topic in any rolling 24h window. Defaults to 2. */
  dailyCapPerTopic?: number;
  /** Articles produced per tick (kept at 1 so each cron invocation is tiny). */
  perTick?: number;
  /** Override "now" for tests. */
  now?: Date;
  /** Cadence between ticks, in hours. Must match the external cron schedule. */
  slotHours?: number;
  signal?: AbortSignal;
}

/**
 * Run one scheduled tick: pick the topic assigned to this slot and, if it
 * hasn't already hit its 24h cap, generate a single article for it.
 *
 * Designed to be called by a cron every `slotHours` (default 2) hours.
 * Safe to call more often — the 24h cap makes extra calls no-ops.
 */
export async function generateOnSchedule(
  opts: ScheduleOptions = {},
): Promise<GeneratedSummary & { picked: string | null }> {
  const dailyCap = opts.dailyCapPerTopic ?? 2;
  const perTick = Math.max(1, opts.perTick ?? 1);
  const now = opts.now ?? new Date();
  const slotHours = opts.slotHours ?? 4;

  const topics = await listTopics();
  const topic = pickTopicForSlot(topics, now, slotHours);
  if (!topic) {
    return {
      topic: "",
      attempted: 0,
      created: 0,
      skipped: [],
      errors: [],
      picked: null,
    };
  }

  const fresh = await countRecentArticles(topic.slug, 24);
  const room = Math.max(0, dailyCap - fresh);
  if (room === 0) {
    return {
      topic: topic.slug,
      attempted: 0,
      created: 0,
      skipped: [`24h cap reached (${fresh}/${dailyCap})`],
      errors: [],
      picked: topic.slug,
    };
  }

  const count = Math.min(perTick, room);
  const result = await generateForTopic({
    topicSlug: topic.slug,
    count,
    signal: opts.signal,
  });
  return { ...result, picked: topic.slug };
}
