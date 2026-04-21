export interface Topic {
  slug: string;
  name: string;
  description: string;
  accent: string;
  display_order: number;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  handle: string;
  bio: string;
  style_tag: string;
  persona_prompt: string;
  avatar_hue: number;
}

export interface ArticleSource {
  type: "x" | "web";
  url: string;
  title?: string;
  handle?: string;
  quote?: string;
}

export interface Article {
  id: string;
  slug: string;
  topic_slug: string;
  author_id: string;
  title: string;
  dek: string;
  body_md: string;
  hero_summary: string;
  tags: string[];
  sources: ArticleSource[];
  reading_time_min: number;
  model: string;
  status: "published" | "draft";
  published_at: string;
  updated_at: string;
}

export interface ArticleWithAuthor extends Article {
  author: Author;
  topic: Topic;
}

export type Timeframe = "24h" | "week" | "month";
