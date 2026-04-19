import { env, hasGrokCredentials, hasXCredentials } from "./env";
import { getSupabase } from "./supabase";
import { searchTweets, XApiError } from "./x-api";
import {
  curatePosts,
  GrokError,
  fallbackRank,
  hashIds,
  summarizeSection,
} from "./grok";
import { buildDemoFeed } from "./demo-data";
import {
  ALL_SECTIONS_MAP,
  TIMEFRAME_LABELS,
  timeframeToHours,
  type Timeframe,
} from "./sections";
import type { PulsePost, PulseSummary, SectionFeed } from "./types";
import { uniqueBy } from "./utils";

/**
 * Pulse's caching & refresh policy
 * ================================
 *
 * Pulse no longer lets end users trigger refetches. The system owns the
 * schedule so we can (a) keep the UI snappy and (b) keep X API costs low.
 *
 * Each timeframe has a refresh cadence:
 *   24h   -> top of every hour (so the "last 24h" always stays current)
 *   week  -> every 6 hours
 *   month -> once every 24 hours
 *
 * On top of that, every curated post is written into an `archive` table
 * keyed by (section_id, tweet_id). Longer timeframes (`week`, `month`)
 * merge fresh X results with the archive, which is how we preserve a
 * story's timeline even after X's 7-day recent-search limit cuts off
 * older items.
 */

const CANDIDATE_POOL_SIZE = 60; // how many candidates we ask X for per refresh
const TARGET_STORY_COUNT = 10; // how many "best of" stories we keep per feed

/**
 * In-memory fallback cache used when Supabase isn't configured. Keyed by
 * sectionId + timeframe.
 */
interface MemoryEntry {
  feed: SectionFeed;
  archive: PulsePost[];
}
const memoryCache = new Map<string, MemoryEntry>();
const memoryArchive = new Map<string, Map<string, PulsePost>>();

function cacheKey(sectionId: string, timeframe: Timeframe) {
  return `${sectionId}:${timeframe}`;
}

/**
 * Refresh cadence for a given timeframe, in milliseconds.
 */
function refreshIntervalMs(timeframe: Timeframe): number {
  switch (timeframe) {
    case "24h":
      return 60 * 60 * 1000;
    case "week":
      return 6 * 60 * 60 * 1000;
    case "month":
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Next aligned refresh boundary for a timeframe. 24h is aligned to the top
 * of each hour so the "rolling 24 hours" window stays tidy.
 */
function nextRefreshBoundary(timeframe: Timeframe, fromMs: number): number {
  if (timeframe === "24h") {
    const nextHour = Math.ceil(fromMs / (60 * 60 * 1000)) * (60 * 60 * 1000);
    return nextHour === fromMs ? fromMs + 60 * 60 * 1000 : nextHour;
  }
  return fromMs + refreshIntervalMs(timeframe);
}

/**
 * Whether the given feed is still within its refresh cadence. Accepts an
 * optional "override" TTL (env.CACHE_TTL_MINUTES) if it is shorter than the
 * natural cadence — useful for local dev.
 */
function isFresh(feed: SectionFeed, timeframe: Timeframe): boolean {
  const ageMs = Date.now() - new Date(feed.updated_at).getTime();
  const interval = refreshIntervalMs(timeframe);
  const override = env.CACHE_TTL_MINUTES * 60 * 1000;
  const ttl = override > 0 ? Math.min(override, interval) : interval;
  return ageMs < ttl;
}

/* -------------------------------------------------------------------------
 * Supabase persistence helpers
 * -----------------------------------------------------------------------*/

async function loadFeedFromSupabase(
  sectionId: string,
  timeframe: Timeframe,
): Promise<SectionFeed | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: postsRow } = await sb
    .from("posts")
    .select("data, updated_at")
    .eq("section_id", sectionId)
    .eq("timeframe", timeframe)
    .maybeSingle();

  if (!postsRow) return null;

  const posts = (postsRow.data ?? []) as PulsePost[];

  const { data: summaryRow } = await sb
    .from("summaries")
    .select("data")
    .eq("section_id", sectionId)
    .eq("timeframe", timeframe)
    .maybeSingle();

  const summary = summaryRow?.data ? (summaryRow.data as PulseSummary) : null;

  return {
    section_id: sectionId,
    timeframe,
    posts,
    summary,
    updated_at: postsRow.updated_at,
    cached: true,
  };
}

async function saveFeedToSupabase(feed: SectionFeed): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { section_id, timeframe, posts, summary, updated_at } = feed;

  await sb.from("posts").upsert(
    { section_id, timeframe, data: posts, updated_at },
    { onConflict: "section_id,timeframe" },
  );

  if (summary) {
    await sb.from("summaries").upsert(
      {
        section_id,
        timeframe,
        input_hash: summary.input_hash,
        data: summary,
        updated_at: summary.generated_at,
      },
      { onConflict: "section_id,timeframe" },
    );
  }
}

async function appendToArchive(
  sectionId: string,
  posts: PulsePost[],
): Promise<void> {
  if (posts.length === 0) return;

  // Memory archive
  const mem =
    memoryArchive.get(sectionId) ?? new Map<string, PulsePost>();
  for (const p of posts) {
    if (!mem.has(p.id)) mem.set(p.id, p);
  }
  memoryArchive.set(sectionId, mem);

  // Supabase archive
  const sb = getSupabase();
  if (!sb) return;
  const rows = posts.map((p) => ({
    section_id: sectionId,
    tweet_id: p.id,
    created_at: p.created_at,
    data: p,
  }));
  try {
    await sb
      .from("archive")
      .upsert(rows, { onConflict: "section_id,tweet_id", ignoreDuplicates: true });
  } catch (err) {
    console.error("[pulse] archive write failed", err);
  }
}

async function loadArchive(
  sectionId: string,
  withinHours: number,
): Promise<PulsePost[]> {
  const cutoff = Date.now() - withinHours * 60 * 60 * 1000;

  const mem = memoryArchive.get(sectionId);
  const memItems = mem
    ? Array.from(mem.values()).filter(
        (p) => new Date(p.created_at).getTime() >= cutoff,
      )
    : [];

  const sb = getSupabase();
  if (!sb) return memItems;

  try {
    const { data } = await sb
      .from("archive")
      .select("data")
      .eq("section_id", sectionId)
      .gte("created_at", new Date(cutoff).toISOString())
      .order("created_at", { ascending: false })
      .limit(300);
    const dbItems = ((data ?? []) as Array<{ data: PulsePost }>).map(
      (r) => r.data,
    );
    return uniqueBy([...memItems, ...dbItems], (p) => p.id);
  } catch (err) {
    console.error("[pulse] archive read failed", err);
    return memItems;
  }
}

/* -------------------------------------------------------------------------
 * Public API
 * -----------------------------------------------------------------------*/

export interface GetFeedOptions {
  sectionId: string;
  timeframe: Timeframe;
  /**
   * When true, bypass the TTL check and refresh now. Used by the scheduled
   * cron and internal tools — never exposed to end-user controls.
   */
  force?: boolean;
}

/**
 * Returns a SectionFeed honouring Pulse's refresh cadence.
 *
 *  1. If a fresh cached feed exists (per-timeframe TTL), return it.
 *  2. Otherwise pull fresh candidates from X, merge with the archive for
 *     longer windows, have Grok curate + write a paragraph briefing, persist
 *     everything, and return.
 *  3. On upstream errors, fall back to the last cached feed, then to demo.
 */
export async function getSectionFeed({
  sectionId,
  timeframe,
  force,
}: GetFeedOptions): Promise<SectionFeed> {
  const section = ALL_SECTIONS_MAP[sectionId];
  if (!section) {
    throw new Error(`Unknown section: ${sectionId}`);
  }

  if (!hasXCredentials()) {
    return withNextRefresh(buildDemoFeed(sectionId, timeframe), timeframe);
  }

  const key = cacheKey(sectionId, timeframe);

  // 1. Memory cache.
  if (!force) {
    const mem = memoryCache.get(key);
    if (mem && isFresh(mem.feed, timeframe)) {
      return withNextRefresh({ ...mem.feed, cached: true }, timeframe);
    }
  }

  // 2. Supabase cache.
  if (!force) {
    try {
      const cached = await loadFeedFromSupabase(sectionId, timeframe);
      if (cached && isFresh(cached, timeframe)) {
        memoryCache.set(key, { feed: cached, archive: [] });
        return withNextRefresh(cached, timeframe);
      }
    } catch (err) {
      console.error("[pulse] supabase load failed", err);
    }
  }

  // 3. Fresh fetch + curate.
  try {
    const rawCandidates = await searchTweets({
      query: section.query,
      timeframe,
      maxResults: CANDIDATE_POOL_SIZE,
    });
    const freshPool = rawCandidates.map((p) => ({
      ...p,
      section_id: sectionId,
    }));

    // Persist the raw pool into the archive so longer windows keep history.
    await appendToArchive(sectionId, freshPool);

    // For week/month, merge with historic archive before curation.
    let pool: PulsePost[] = freshPool;
    if (timeframe !== "24h") {
      const historyHours = Math.min(timeframeToHours(timeframe), 24 * 30);
      const history = await loadArchive(sectionId, historyHours);
      pool = uniqueBy([...freshPool, ...history], (p) => p.id);
    }
    // Drop obvious duplicates / near-dup headlines before Grok.
    pool = dedupeByHeadline(pool);

    const tfLabel = TIMEFRAME_LABELS[timeframe];

    let curated: PulsePost[];
    if (hasGrokCredentials()) {
      try {
        curated = await curatePosts(
          section.name,
          tfLabel,
          pool,
          TARGET_STORY_COUNT,
        );
      } catch (err) {
        console.error("[pulse] curation failed", err);
        curated = fallbackRank(pool, TARGET_STORY_COUNT);
      }
    } else {
      curated = fallbackRank(pool, TARGET_STORY_COUNT);
    }

    // Generate briefing (regenerate only when input set changes).
    const inputHash = hashIds(curated.map((p) => p.id));
    let summary: PulseSummary | null = null;
    if (hasGrokCredentials()) {
      try {
        const existing = await loadFeedFromSupabase(sectionId, timeframe);
        if (existing?.summary && existing.summary.input_hash === inputHash) {
          summary = existing.summary;
        } else {
          summary = await summarizeSection(
            sectionId,
            section.name,
            timeframe,
            tfLabel,
            curated,
            inputHash,
          );
        }
      } catch (err) {
        if (err instanceof GrokError) {
          console.error("[pulse] grok failed", err.status, err.detail);
        } else {
          console.error("[pulse] grok failed", err);
        }
      }
    }

    const feed: SectionFeed = {
      section_id: sectionId,
      timeframe,
      posts: curated,
      summary,
      updated_at: new Date().toISOString(),
      cached: false,
    };

    memoryCache.set(key, { feed, archive: [] });
    try {
      await saveFeedToSupabase(feed);
    } catch (err) {
      console.error("[pulse] supabase save failed", err);
    }
    return withNextRefresh(feed, timeframe);
  } catch (err) {
    if (err instanceof XApiError) {
      console.error("[pulse] X api failed", err.status, err.detail);
    } else {
      console.error("[pulse] X api failed", err);
    }
    const stale = memoryCache.get(key);
    if (stale) return withNextRefresh({ ...stale.feed, cached: true }, timeframe);
    try {
      const db = await loadFeedFromSupabase(sectionId, timeframe);
      if (db) return withNextRefresh(db, timeframe);
    } catch {
      // fall through
    }
    return withNextRefresh(buildDemoFeed(sectionId, timeframe), timeframe);
  }
}

function withNextRefresh(
  feed: SectionFeed,
  timeframe: Timeframe,
): SectionFeed {
  if (feed.demo) return feed;
  const base = new Date(feed.updated_at).getTime();
  const next = nextRefreshBoundary(timeframe, base);
  return { ...feed, next_refresh_at: new Date(next).toISOString() };
}

function dedupeByHeadline(posts: PulsePost[]): PulsePost[] {
  const seen = new Set<string>();
  const out: PulsePost[] = [];
  for (const p of posts) {
    const key = p.text
      .slice(0, 70)
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
