import { env, hasGrokCredentials, hasXCredentials } from "./env";
import { getSupabase } from "./supabase";
import { searchTweets, XApiError } from "./x-api";
import { GrokError, hashIds, summarizeSection } from "./grok";
import { buildDemoFeed } from "./demo-data";
import { ALL_SECTIONS_MAP, type Timeframe } from "./sections";
import type { PulsePost, PulseSummary, SectionFeed } from "./types";
import { uniqueBy } from "./utils";

/**
 * In-memory fallback cache used when Supabase isn't configured. Keyed by
 * sectionId + timeframe. Entries expire on the same TTL as the DB cache.
 */
const memoryCache = new Map<string, SectionFeed>();

function cacheKey(sectionId: string, timeframe: Timeframe) {
  return `${sectionId}:${timeframe}`;
}

function isFresh(feed: SectionFeed): boolean {
  const age = Date.now() - new Date(feed.updated_at).getTime();
  const ttlMs = env.CACHE_TTL_MINUTES * 60 * 1000;
  return age < ttlMs;
}

async function loadCachedFromSupabase(
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

  const summary = summaryRow?.data
    ? (summaryRow.data as PulseSummary)
    : null;

  return {
    section_id: sectionId,
    timeframe,
    posts,
    summary,
    updated_at: postsRow.updated_at,
    cached: true,
  };
}

async function saveToSupabase(feed: SectionFeed): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { section_id, timeframe, posts, summary, updated_at } = feed;

  // Upsert posts row
  await sb.from("posts").upsert(
    {
      section_id,
      timeframe,
      data: posts,
      updated_at,
    },
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

export interface GetFeedOptions {
  sectionId: string;
  timeframe: Timeframe;
  force?: boolean;
}

/**
 * Returns a SectionFeed honouring our caching rules:
 *   1. If a fresh cached feed exists (TTL ~ env.CACHE_TTL_MINUTES), return it.
 *   2. Otherwise fetch from X, regenerate the Grok summary only if the input
 *      hash changed, persist to Supabase, and return.
 *   3. On X/Grok errors, fall back to the last cached feed if we have one.
 *   4. In demo mode (no X token) we always return the deterministic demo
 *      feed so the UI is still beautiful out of the box.
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
    return buildDemoFeed(sectionId, timeframe);
  }

  const key = cacheKey(sectionId, timeframe);

  // Memory cache first (fast path, avoids Supabase round trip).
  if (!force) {
    const mem = memoryCache.get(key);
    if (mem && isFresh(mem)) return { ...mem, cached: true };
  }

  // Supabase next.
  if (!force) {
    try {
      const cached = await loadCachedFromSupabase(sectionId, timeframe);
      if (cached && isFresh(cached)) {
        memoryCache.set(key, cached);
        return cached;
      }
    } catch (err) {
      // Don't let DB errors block fresh fetches
      console.error("[pulse] supabase cache load failed", err);
    }
  }

  // Fetch fresh.
  try {
    const rawPosts = await searchTweets({
      query: section.query,
      timeframe,
      maxResults: 20,
    });
    const posts = uniqueBy(
      rawPosts.map((p) => ({ ...p, section_id: sectionId })),
      (p) => p.id,
    ).slice(0, 12);

    // Decide whether to regenerate the Grok summary.
    const inputHash = hashIds(posts.map((p) => p.id));
    let summary: PulseSummary | null = null;
    if (hasGrokCredentials()) {
      try {
        const existing = await loadCachedFromSupabase(sectionId, timeframe);
        if (existing?.summary && existing.summary.input_hash === inputHash) {
          summary = existing.summary;
        } else {
          summary = await summarizeSection(
            sectionId,
            section.name,
            timeframe,
            posts,
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
      posts,
      summary,
      updated_at: new Date().toISOString(),
      cached: false,
    };

    memoryCache.set(key, feed);
    try {
      await saveToSupabase(feed);
    } catch (err) {
      console.error("[pulse] supabase save failed", err);
    }
    return feed;
  } catch (err) {
    // Graceful fallback: stale cache, then demo.
    if (err instanceof XApiError) {
      console.error("[pulse] X api failed", err.status, err.detail);
    } else {
      console.error("[pulse] X api failed", err);
    }
    const stale = memoryCache.get(key);
    if (stale) return { ...stale, cached: true };
    try {
      const db = await loadCachedFromSupabase(sectionId, timeframe);
      if (db) return db;
    } catch {
      // ignore
    }
    return buildDemoFeed(sectionId, timeframe);
  }
}
