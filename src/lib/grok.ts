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

function buildPrompt(sectionName: string, posts: PulsePost[]): string {
  const lines = posts.map((p, i) => {
    const metrics =
      `likes=${p.metrics.like_count} reposts=${p.metrics.retweet_count}`;
    return `#${i + 1} [id=${p.id}] @${p.author_handle}${p.author_verified ? " ✓" : ""} — ${metrics}\n${p.text}`;
  });

  return `You are Grok, producing a concise editorial brief for a dark-mode news reader called Pulse.
Section: ${sectionName}

Given the posts below, respond with STRICT JSON matching this schema:
{
  "overview": "A 2-3 sentence plain-English summary of what matters most right now. Calm, factual, non-promotional.",
  "themes": ["3-5 short (<=6 word) theme tags that describe recurring subjects"],
  "takeaways": {
    "<tweet_id>": ["3-6 very short bullet takeaways", "each <= 120 chars", "no hashtags"]
  }
}

Rules:
- Only include a tweet id in "takeaways" if it's newsworthy.
- Do NOT invent facts. If a tweet is vague, say so plainly.
- No emoji. No marketing language. No first-person. No links.

POSTS:
${lines.join("\n\n")}

Return ONLY JSON. No prose before or after.`;
}

/**
 * Call Grok with a deterministic JSON prompt. Returns a PulseSummary.
 * Uses env.XAI_MODEL, defaulting to `grok-4-1-fast-reasoning`.
 */
export async function summarizeSection(
  sectionId: string,
  sectionName: string,
  timeframe: string,
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
      overview: "No posts in this timeframe yet. Try expanding to 72h.",
      themes: [],
      takeaways: {},
      generated_at: new Date().toISOString(),
      input_hash: inputHash,
    };
  }

  const prompt = buildPrompt(sectionName, posts);

  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.XAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an editorial summarizer. You always return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => undefined);
    throw new GrokError(`Grok request failed: ${res.status}`, res.status, detail);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content ?? "";
  const parsed = safeParseJson(raw);

  return {
    section_id: sectionId,
    timeframe,
    overview: parsed.overview || "Summary unavailable for this window.",
    themes: (parsed.themes ?? []).slice(0, 6),
    takeaways: normalizeTakeaways(parsed.takeaways ?? {}),
    generated_at: new Date().toISOString(),
    input_hash: inputHash,
  };
}

function safeParseJson(raw: string): GrokSummaryJson {
  const trimmed = raw.trim().replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(trimmed) as GrokSummaryJson;
  } catch {
    // Last-ditch: find the outermost {...}
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as GrokSummaryJson;
      } catch {
        // fall through
      }
    }
    return { overview: "", themes: [], takeaways: {} };
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
