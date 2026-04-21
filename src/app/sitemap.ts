import type { MetadataRoute } from "next";
import { listArticleSlugs, listTopics } from "@/lib/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bylines.local";
  const [topics, slugs] = await Promise.all([
    listTopics(),
    listArticleSlugs(),
  ]);
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    ...topics.map((t) => ({
      url: `${base}/topic/${t.slug}`,
      lastModified: now,
    })),
    ...slugs.map((s) => ({
      url: `${base}/article/${s.slug}`,
      lastModified: new Date(s.published_at),
    })),
  ];
}
