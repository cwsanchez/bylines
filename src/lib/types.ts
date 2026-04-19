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
  /**
   * Optional editorial score produced by Grok while ranking candidates.
   * Higher = more important / trending. Not shown in UI, but useful for
   * debugging and ordering.
   */
  editorial_score?: number;
  /**
   * One-line "why this matters" rationale produced by Grok when curating.
   * Rendered in the pod card under the headline for extra context.
   */
  why_it_matters?: string | null;
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

/** Grok-generated editorial briefing for the section. */
export interface PulseSummary {
  section_id: string;
  timeframe: string;
  /**
   * A well-structured paragraph (roughly 120-200 words) summarising what
   * matters most in this section for the chosen time window. Written in
   * calm, factual newsroom prose.
   */
  overview: string;
  /** 3-6 short theme tags describing recurring subjects. */
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
  /** ISO timestamp of the next scheduled refresh (for UI copy). */
  next_refresh_at?: string;
}
