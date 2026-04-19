import { env } from "./env";
import type { PulseMedia, PulseMetrics, PulsePost } from "./types";
import { timeframeToHours, type Timeframe } from "./sections";

const X_API_BASE = "https://api.twitter.com/2/tweets/search/recent";

interface XUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}

interface XMediaRaw {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
  alt_text?: string;
}

interface XTweetRaw {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  entities?: {
    urls?: Array<{ url: string; expanded_url?: string; display_url?: string }>;
  };
  attachments?: { media_keys?: string[] };
}

interface XSearchResponse {
  data?: XTweetRaw[];
  includes?: {
    users?: XUser[];
    media?: XMediaRaw[];
  };
  meta?: { result_count?: number; next_token?: string };
  title?: string;
  detail?: string;
  status?: number;
}

export class XApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
    this.name = "XApiError";
  }
}

export interface SearchTweetsParams {
  query: string;
  timeframe: Timeframe;
  maxResults?: number;
  signal?: AbortSignal;
}

/**
 * Calls X API v2 recent search. Throws XApiError on non-200 responses.
 * Returns normalized PulsePost objects ready for UI/DB.
 */
export async function searchTweets({
  query,
  timeframe,
  maxResults = 20,
  signal,
}: SearchTweetsParams): Promise<PulsePost[]> {
  if (!env.X_BEARER_TOKEN) {
    throw new XApiError("X_BEARER_TOKEN is not configured", 500);
  }

  const hours = timeframeToHours(timeframe);
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(Math.max(maxResults, 10), 100)),
    start_time: startTime,
    "tweet.fields":
      "created_at,public_metrics,entities,attachments,author_id,lang",
    expansions: "author_id,attachments.media_keys",
    "user.fields": "name,username,profile_image_url,verified",
    "media.fields": "type,url,preview_image_url,width,height,alt_text",
    sort_order: "relevancy",
  });

  const url = `${X_API_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.X_BEARER_TOKEN}`,
      "User-Agent": "PulseNewsReader/1.0",
    },
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as XSearchResponse;
      detail = body.detail ?? body.title;
    } catch {
      detail = await res.text();
    }
    throw new XApiError(
      `X API request failed: ${res.status}`,
      res.status,
      detail,
    );
  }

  const body = (await res.json()) as XSearchResponse;
  return normalizeResponse(body);
}

function normalizeResponse(body: XSearchResponse): PulsePost[] {
  const tweets = body.data ?? [];
  const users = new Map<string, XUser>(
    (body.includes?.users ?? []).map((u) => [u.id, u]),
  );
  const media = new Map<string, XMediaRaw>(
    (body.includes?.media ?? []).map((m) => [m.media_key, m]),
  );

  return tweets.map((t): PulsePost => {
    const author =
      users.get(t.author_id) ??
      ({
        id: t.author_id,
        name: "Unknown",
        username: "unknown",
      } as XUser);

    const firstExternalUrl = t.entities?.urls?.find(
      (u) =>
        u.expanded_url &&
        !u.expanded_url.includes("twitter.com") &&
        !u.expanded_url.includes("x.com"),
    );

    const tweetMedia: PulseMedia[] = (t.attachments?.media_keys ?? [])
      .map((k) => media.get(k))
      .filter((m): m is XMediaRaw => Boolean(m))
      .map((m) => ({
        type: m.type,
        url: m.url ?? m.preview_image_url ?? "",
        preview_url: m.preview_image_url ?? null,
        width: m.width,
        height: m.height,
        alt_text: m.alt_text ?? null,
      }))
      .filter((m) => m.url);

    const metrics: PulseMetrics = {
      like_count: t.public_metrics?.like_count ?? 0,
      reply_count: t.public_metrics?.reply_count ?? 0,
      retweet_count: t.public_metrics?.retweet_count ?? 0,
      quote_count: t.public_metrics?.quote_count ?? 0,
      impression_count: t.public_metrics?.impression_count,
    };

    return {
      id: t.id,
      section_id: "",
      author_handle: author.username,
      author_name: author.name,
      author_avatar: author.profile_image_url ?? null,
      author_verified: author.verified ?? false,
      text: cleanText(t.text),
      created_at: t.created_at,
      url: firstExternalUrl?.expanded_url ?? null,
      tweet_url: `https://x.com/${author.username}/status/${t.id}`,
      media: tweetMedia,
      metrics,
      fetched_at: new Date().toISOString(),
    };
  });
}

/**
 * Remove trailing t.co link (X always appends one pointing to the tweet or the
 * first entity) and collapse excessive whitespace. Keeps the original text
 * otherwise.
 */
function cleanText(text: string): string {
  const withoutTrailing = text.replace(/\s+https?:\/\/t\.co\/\w+\s*$/g, "");
  return withoutTrailing.replace(/[ \t]+/g, " ").trim();
}
