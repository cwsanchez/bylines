import type { Author } from "./types";

/**
 * Pick an author deterministically-but-varied for a topic + title.
 * We weight a "preferred" set of authors per topic so certain voices show up
 * more often in the topics they match, but every author can still surface.
 */
const TOPIC_PREFERENCES: Record<string, string[]> = {
  tech: ["kai-nakamura", "avery-chen", "morgan-hale", "dana-okafor"],
  "us-politics": [
    "avery-chen",
    "morgan-hale",
    "reid-calloway",
    "sam-rivera",
    "dana-okafor",
  ],
  world: ["avery-chen", "reid-calloway", "morgan-hale", "sam-rivera"],
  games: ["kai-nakamura", "dana-okafor", "avery-chen"],
  sports: ["dana-okafor", "avery-chen", "morgan-hale"],
  science: ["avery-chen", "morgan-hale", "kai-nakamura", "dana-okafor"],
};

// Cheap deterministic hash so the same title always gets the same author.
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function pickAuthor(
  topicSlug: string,
  title: string,
  authors: Author[],
): Author {
  const pref = TOPIC_PREFERENCES[topicSlug] ?? [];
  const preferred = pref
    .map((slug) => authors.find((a) => a.slug === slug))
    .filter((a): a is Author => !!a);
  const pool = preferred.length ? preferred : authors;
  const idx = hashString(`${topicSlug}|${title}`) % pool.length;
  return pool[idx];
}
