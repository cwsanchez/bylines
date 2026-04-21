import { getAnonSupabase, getServiceSupabase } from "./supabase";
import type {
  Article,
  ArticleSource,
  ArticleWithAuthor,
  Author,
  Timeframe,
  Topic,
} from "./types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function timeframeSince(tf: Timeframe, now: Date = new Date()): Date {
  const d = new Date(now);
  if (tf === "24h") d.setUTCHours(d.getUTCHours() - 24);
  else if (tf === "week") d.setUTCDate(d.getUTCDate() - 7);
  else d.setUTCDate(d.getUTCDate() - 30);
  return d;
}

export async function listTopics(): Promise<Topic[]> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return [];
  const { data, error } = await supa
    .from("topics")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function listAuthors(): Promise<Author[]> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return [];
  const { data, error } = await supa.from("authors").select("*");
  if (error) throw error;
  return (data ?? []) as Author[];
}

interface ListArticlesArgs {
  topicSlug?: string;
  timeframe?: Timeframe;
  limit?: number;
  offset?: number;
}

export async function listArticles(
  args: ListArticlesArgs = {},
): Promise<ArticleWithAuthor[]> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return [];

  let query = supa
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (args.topicSlug) query = query.eq("topic_slug", args.topicSlug);
  if (args.timeframe) {
    const since = timeframeSince(args.timeframe);
    query = query.gte("published_at", since.toISOString());
  }
  if (args.limit) query = query.limit(args.limit);
  if (typeof args.offset === "number" && args.limit) {
    query = query.range(args.offset, args.offset + args.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const articles = (data ?? []) as Article[];
  if (articles.length === 0) return [];

  const [authors, topics] = await Promise.all([listAuthors(), listTopics()]);
  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const topicMap = new Map(topics.map((t) => [t.slug, t]));

  return articles
    .map((a) => {
      const author = authorMap.get(a.author_id);
      const topic = topicMap.get(a.topic_slug);
      if (!author || !topic) return null;
      return { ...a, author, topic } as ArticleWithAuthor;
    })
    .filter((a): a is ArticleWithAuthor => a !== null);
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleWithAuthor | null> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return null;
  const { data, error } = await supa
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const article = data as Article;
  const [authors, topics] = await Promise.all([listAuthors(), listTopics()]);
  const author = authors.find((a) => a.id === article.author_id);
  const topic = topics.find((t) => t.slug === article.topic_slug);
  if (!author || !topic) return null;
  return { ...article, author, topic };
}

export interface InsertArticle {
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
}

function estimateReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
}

async function uniqueSlug(base: string): Promise<string> {
  const supa = getServiceSupabase();
  if (!supa) return base;
  let candidate = base;
  for (let i = 1; i < 20; i++) {
    const { data } = await supa
      .from("articles")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i + 1}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function insertArticle(
  a: InsertArticle,
): Promise<Article | null> {
  const supa = getServiceSupabase();
  if (!supa) return null;

  const baseSlug = slugify(a.title) || `story-${Date.now().toString(36)}`;
  const slug = await uniqueSlug(baseSlug);
  const reading = a.reading_time_min || estimateReadingTime(a.body_md);

  const payload = {
    ...a,
    slug,
    reading_time_min: reading,
    status: "published" as const,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supa
    .from("articles")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Article;
}

export async function listArticleSlugs(): Promise<
  { slug: string; topic_slug: string; published_at: string }[]
> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return [];
  const { data, error } = await supa
    .from("articles")
    .select("slug, topic_slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as {
    slug: string;
    topic_slug: string;
    published_at: string;
  }[];
}

/** Articles live on the home/topic pages for this long; older stories move
 * to the `/archive` view. */
export const ARCHIVE_AFTER_DAYS = 30;

export function archiveCutoff(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - ARCHIVE_AFTER_DAYS);
  return d;
}

interface ListArchiveArgs {
  topicSlug?: string;
  limit?: number;
  offset?: number;
}

/**
 * List articles older than {@link ARCHIVE_AFTER_DAYS} days, ordered
 * newest-first. Supports simple offset pagination for the archive index.
 */
export async function listArchiveArticles(
  args: ListArchiveArgs = {},
): Promise<{ articles: ArticleWithAuthor[]; total: number }> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return { articles: [], total: 0 };

  const cutoff = archiveCutoff().toISOString();
  let query = supa
    .from("articles")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .lt("published_at", cutoff)
    .order("published_at", { ascending: false });

  if (args.topicSlug) query = query.eq("topic_slug", args.topicSlug);
  const limit = args.limit ?? 24;
  const offset = args.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const articles = (data ?? []) as Article[];
  if (articles.length === 0) return { articles: [], total: count ?? 0 };

  const [authors, topics] = await Promise.all([listAuthors(), listTopics()]);
  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const topicMap = new Map(topics.map((t) => [t.slug, t]));

  const withRefs = articles
    .map((a) => {
      const author = authorMap.get(a.author_id);
      const topic = topicMap.get(a.topic_slug);
      if (!author || !topic) return null;
      return { ...a, author, topic } as ArticleWithAuthor;
    })
    .filter((a): a is ArticleWithAuthor => a !== null);

  return { articles: withRefs, total: count ?? withRefs.length };
}

export async function countRecentArticles(
  topicSlug: string,
  sinceHours: number,
): Promise<number> {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  if (!supa) return 0;
  const since = new Date();
  since.setUTCHours(since.getUTCHours() - sinceHours);
  const { count, error } = await supa
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("topic_slug", topicSlug)
    .gte("published_at", since.toISOString());
  if (error) throw error;
  return count ?? 0;
}
