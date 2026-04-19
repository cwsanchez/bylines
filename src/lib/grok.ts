import { env } from "./env";
import type { PulsePost, PulseSummary } from "./types";

const XAI_URL = "https://api.x.ai/v1/chat/completions";

export class GrokError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
    this.name = "GrokError";
  }
}

interface GrokSummaryJson {
  overview: string;
  themes: string[];
  takeaways: Record<string, string[]>;
}

interface GrokRankingJson {
  picks: Array<{
    id: string;
    score?: number;
    why?: string;
  }>;
}

/**
 * Low-level call helper. Returns the raw assistant message content.
 */
async function callGrok(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!env.XAI_API_KEY) {
    throw new GrokError("XAI_API_KEY is not configured", 500);
  }
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.XAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => undefined);
    throw new GrokError(
      `Grok request failed: ${res.status}`,
      res.status,
      detail,
    );
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content ?? "";
}

function buildRankingPrompt(
  sectionName: string,
  timeframeLabel: string,
  candidates: PulsePost[],
  targetCount: number,
): string {
  const lines = candidates.map((p, i) => {
    const m = p.metrics;
    const engagement = `likes=${m.like_count} reposts=${m.retweet_count} replies=${m.reply_count}`;
    const hours = (
      (Date.now() - new Date(p.created_at).getTime()) /
      3_600_000
    ).toFixed(1);
    return `#${i + 1} [id=${p.id}] @${p.author_handle}${
      p.author_verified ? " ✓" : ""
    } · ${hours}h ago · ${engagement}\n${p.text.slice(0, 400)}`;
  });

  return `You are Grok, the news-curation editor for Pulse, a premium dark-mode news reader.

SECTION: ${sectionName}
TIMEFRAME: ${timeframeLabel}
TASK: From the ${candidates.length} candidate posts below, select the ${targetCount} posts that best represent the most important, trending, and newsworthy developments in this section over the timeframe. Think like the editor of a daily briefing: the reader should come away knowing what a well-informed person keeping up with ${sectionName.toLowerCase()} would know.

Selection criteria (in order):
1. Newsworthiness — major developments, official announcements, verified breaking news.
2. Distinct storylines — avoid redundant posts that cover the same event; prefer the clearest, most authoritative version.
3. Credibility of source — verified accounts and established outlets are strongly preferred.
4. Engagement / hype — tie-break on likes + reposts when stories are comparable.
5. Freshness within the window — newer is better when other factors are equal.

Respond with STRICT JSON in this schema:
{
  "picks": [
    {
      "id": "<tweet id from list above>",
      "score": <number 1-100, higher = more important>,
      "why": "<one short sentence (<= 110 chars) explaining why this story matters>"
    }
  ]
}

Rules:
- Return exactly ${targetCount} picks, ordered best-first.
- Only use ids that appear in the candidate list.
- Do not fabricate. If fewer than ${targetCount} quality items exist, pad with the next most credible posts.
- No emoji. No marketing language. No hashtags.

CANDIDATES:
${lines.join("\n\n")}

Return ONLY JSON.`;
}

function buildBriefingPrompt(
  sectionName: string,
  timeframeLabel: string,
  posts: PulsePost[],
): string {
  const lines = posts.map((p, i) => {
    const metrics = `likes=${p.metrics.like_count} reposts=${p.metrics.retweet_count}`;
    return `#${i + 1} [id=${p.id}] @${p.author_handle}${
      p.author_verified ? " ✓" : ""
    } — ${metrics}\n${p.text}`;
  });

  return `You are Grok, producing the editorial briefing that sits above a curated set of news stories for Pulse's ${sectionName} section, covering the last ${timeframeLabel}.

Respond with STRICT JSON matching this schema:
{
  "overview": "One well-structured paragraph of roughly 120-180 words. Calm, newsroom-style prose. Synthesize the stories below into a coherent narrative that connects the major developments, highlights tensions or trends, and gives the reader genuinely useful context. Lead with the single most important development, then widen to the surrounding picture. Avoid listing stories; write in flowing sentences. Do not use first-person. Do not use emoji or hashtags. Do not use marketing language. Do not include URLs.",
  "themes": ["3-6 short (<=4 word) theme tags describing recurring subjects"],
  "takeaways": {
    "<tweet_id>": ["2-4 very short (<=110 char) bullet takeaways per noteworthy post"]
  }
}

Rules:
- Ground every claim in the posts below; do NOT invent facts.
- If a post is thin, give it fewer / shorter takeaways (or omit from "takeaways").
- Prefer precise over breezy.

POSTS:
${lines.join("\n\n")}

Return ONLY JSON. No prose before or after.`;
}

/**
 * Ranks a large candidate pool down to the best N stories for the section,
 * attaching editorial scores and "why it matters" rationales.
 *
 * Falls back gracefully on failure: returns the top N by engagement.
 */
export async function curatePosts(
  sectionName: string,
  timeframeLabel: string,
  candidates: PulsePost[],
  targetCount: number,
  signal?: AbortSignal,
): Promise<PulsePost[]> {
  if (candidates.length === 0) return [];
  if (!env.XAI_API_KEY) {
    return fallbackRank(candidates, targetCount);
  }
  if (candidates.length <= targetCount) {
    return [...candidates].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  try {
    const raw = await callGrok(
      "You are an expert news editor. You always return valid JSON only.",
      buildRankingPrompt(
        sectionName,
        timeframeLabel,
        candidates,
        targetCount,
      ),
      signal,
    );
    const parsed = safeParseJson<GrokRankingJson>(raw, { picks: [] });
    const byId = new Map(candidates.map((p) => [p.id, p]));
    const picked: PulsePost[] = [];
    for (const pick of parsed.picks ?? []) {
      const base = byId.get(pick.id);
      if (!base) continue;
      picked.push({
        ...base,
        editorial_score: typeof pick.score === "number" ? pick.score : undefined,
        why_it_matters:
          typeof pick.why === "string" && pick.why.trim().length > 0
            ? pick.why.trim().slice(0, 180)
            : null,
      });
      if (picked.length >= targetCount) break;
    }
    if (picked.length === 0) {
      return fallbackRank(candidates, targetCount);
    }
    // If Grok picked fewer than asked, top up with engagement-ranked extras.
    if (picked.length < targetCount) {
      const chosen = new Set(picked.map((p) => p.id));
      for (const p of fallbackRank(candidates, targetCount * 2)) {
        if (chosen.has(p.id)) continue;
        picked.push(p);
        if (picked.length >= targetCount) break;
      }
    }
    return picked;
  } catch (err) {
    console.error("[pulse] grok curation failed, falling back", err);
    return fallbackRank(candidates, targetCount);
  }
}

/**
 * Engagement + recency ranking, used when Grok is unavailable.
 */
export function fallbackRank(
  candidates: PulsePost[],
  targetCount: number,
): PulsePost[] {
  const now = Date.now();
  const scored = candidates.map((p) => {
    const eng =
      p.metrics.like_count * 1 +
      p.metrics.retweet_count * 3 +
      p.metrics.reply_count * 0.5 +
      p.metrics.quote_count * 2;
    const ageHours =
      (now - new Date(p.created_at).getTime()) / 3_600_000 || 1;
    // Engagement damped by age, with a verified-source bonus.
    const score =
      (Math.log10(eng + 10) * 40) / Math.pow(ageHours + 3, 0.35) +
      (p.author_verified ? 3 : 0);
    return { post: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // Dedupe near-duplicate headlines.
  const seen = new Set<string>();
  const out: PulsePost[] = [];
  for (const { post, score } of scored) {
    const key = post.text.slice(0, 60).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...post, editorial_score: score });
    if (out.length >= targetCount) break;
  }
  return out;
}

/**
 * Produces a paragraph-length editorial briefing plus per-post takeaways
 * for a curated set of posts.
 */
export async function summarizeSection(
  sectionId: string,
  sectionName: string,
  timeframe: string,
  timeframeLabel: string,
  posts: PulsePost[],
  inputHash: string,
  signal?: AbortSignal,
): Promise<PulseSummary> {
  if (!env.XAI_API_KEY) {
    throw new GrokError("XAI_API_KEY is not configured", 500);
  }
  if (posts.length === 0) {
    return {
      section_id: sectionId,
      timeframe,
      overview:
        "No stories in this window yet. Try expanding the timeframe to see a richer briefing.",
      themes: [],
      takeaways: {},
      generated_at: new Date().toISOString(),
      input_hash: inputHash,
    };
  }

  const raw = await callGrok(
    "You are an editorial summarizer. You always return valid JSON only.",
    buildBriefingPrompt(sectionName, timeframeLabel, posts),
    signal,
  );
  const parsed = safeParseJson<GrokSummaryJson>(raw, {
    overview: "",
    themes: [],
    takeaways: {},
  });

  return {
    section_id: sectionId,
    timeframe,
    overview:
      parsed.overview?.trim() ||
      "Briefing unavailable for this window.",
    themes: (parsed.themes ?? []).slice(0, 6),
    takeaways: normalizeTakeaways(parsed.takeaways ?? {}),
    generated_at: new Date().toISOString(),
    input_hash: inputHash,
  };
}

function safeParseJson<T>(raw: string, fallback: T): T {
  const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        // fall through
      }
    }
    return fallback;
  }
}

function normalizeTakeaways(
  input: Record<string, unknown>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!Array.isArray(v)) continue;
    const bullets = v
      .map((b) => (typeof b === "string" ? b.trim() : ""))
      .filter((b) => b.length > 0)
      .slice(0, 6);
    if (bullets.length > 0) out[String(k)] = bullets;
  }
  return out;
}

/** Deterministic short hash of an ordered id list. */
export function hashIds(ids: string[]): string {
  const sorted = [...ids].sort();
  let h = 5381;
  for (const id of sorted) {
    for (let i = 0; i < id.length; i++) {
      h = ((h << 5) + h + id.charCodeAt(i)) | 0;
    }
    h = ((h << 5) + h + 124) | 0;
  }
  return (h >>> 0).toString(36);
}
