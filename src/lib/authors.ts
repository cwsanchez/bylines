import type { Author } from "./types";

/**
 * Pick an author deterministically-but-varied for a topic + title.
 *
 * We keep three kinds of gating:
 *
 *  1. Political voices (morgan-hale, reid-calloway, sam-rivera) are only ever
 *     eligible for US politics and world politics. They never show up as the
 *     byline on a tech, finance, sports, games, or science story.
 *  2. Finance voices (milo-grant, parker-ellis) are primary on the finance
 *     beat and may optionally assist on business-adjacent beats that touch
 *     markets (tech earnings / deals, world markets), but nowhere else.
 *  3. Everything else is routed to the neutral/explanatory authors, with a
 *     topic-appropriate preference ordering so the voice fits the beat.
 */
const TOPIC_PREFERENCES: Record<string, string[]> = {
  tech: ["kai-nakamura", "avery-chen", "dana-okafor", "milo-grant"],
  "us-politics": [
    "morgan-hale",
    "reid-calloway",
    "sam-rivera",
    "avery-chen",
    "dana-okafor",
  ],
  world: [
    "avery-chen",
    "morgan-hale",
    "reid-calloway",
    "sam-rivera",
    "dana-okafor",
    "milo-grant",
  ],
  games: ["kai-nakamura", "dana-okafor", "avery-chen"],
  sports: ["dana-okafor", "avery-chen", "kai-nakamura"],
  science: ["avery-chen", "dana-okafor", "kai-nakamura"],
  finance: ["milo-grant", "parker-ellis", "avery-chen", "kai-nakamura"],
};

/**
 * Hard block list: an author will NEVER be picked for any topic whose slug is
 * in their block list, even if they were accidentally added to the preference
 * list above. This is the safety net that keeps political voices off of
 * non-political beats.
 */
const AUTHOR_BLOCKED_TOPICS: Record<string, string[]> = {
  "morgan-hale": ["tech", "games", "sports", "science", "finance"],
  "reid-calloway": ["tech", "games", "sports", "science", "finance"],
  "sam-rivera": ["tech", "games", "sports", "science", "finance"],
  "milo-grant": ["us-politics", "games", "sports", "science"],
  "parker-ellis": ["us-politics", "world", "games", "sports", "science"],
  "kai-nakamura": ["us-politics"],
};

// Cheap deterministic hash so the same title always gets the same author.
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function isAllowed(authorSlug: string, topicSlug: string): boolean {
  const blocked = AUTHOR_BLOCKED_TOPICS[authorSlug];
  return !blocked || !blocked.includes(topicSlug);
}

export function pickAuthor(
  topicSlug: string,
  title: string,
  authors: Author[],
): Author {
  const pref = TOPIC_PREFERENCES[topicSlug] ?? [];
  const preferred = pref
    .map((slug) => authors.find((a) => a.slug === slug))
    .filter((a): a is Author => !!a)
    .filter((a) => isAllowed(a.slug, topicSlug));

  let pool: Author[];
  if (preferred.length > 0) {
    pool = preferred;
  } else {
    const fallback = authors.filter((a) => isAllowed(a.slug, topicSlug));
    pool = fallback.length > 0 ? fallback : authors;
  }

  const idx = hashString(`${topicSlug}|${title}`) % pool.length;
  return pool[idx];
}
