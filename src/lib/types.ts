export interface PulsePost {
  /** Canonical X tweet id. */
  id: string;
  section_id: string;
  author_handle: string;
  author_name: string;
  author_avatar?: string | null;
  author_verified?: boolean;
  text: string;
  /** ISO timestamp. */
  created_at: string;
  /** First non-X link detected in the tweet (may be null). */
  url?: string | null;
  /** Permalink to the tweet on X. */
  tweet_url: string;
  media: PulseMedia[];
  metrics: PulseMetrics;
  fetched_at: string;
}

export interface PulseMedia {
  type: "photo" | "video" | "animated_gif";
  url: string;
  preview_url?: string | null;
  width?: number;
  height?: number;
  alt_text?: string | null;
}

export interface PulseMetrics {
  like_count: number;
  reply_count: number;
  retweet_count: number;
  quote_count: number;
  impression_count?: number;
}

/** Grok-generated section summary + per-post key takeaways. */
export interface PulseSummary {
  section_id: string;
  timeframe: string;
  overview: string;
  themes: string[];
  /** Map of tweet_id -> array of short bullet strings. */
  takeaways: Record<string, string[]>;
  generated_at: string;
  /** Hash of input tweet ids; lets us decide whether to regenerate. */
  input_hash: string;
}

export interface SectionFeed {
  section_id: string;
  timeframe: string;
  posts: PulsePost[];
  summary: PulseSummary | null;
  updated_at: string;
  /** True when served from cache; false when freshly fetched. */
  cached: boolean;
  /** Optional demo flag when running without credentials. */
  demo?: boolean;
}
