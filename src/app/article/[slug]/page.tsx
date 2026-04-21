import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  listArticles,
  listArticleSlugs,
} from "@/lib/articles";
import { AuthorAvatar } from "@/components/author-avatar";
import { renderMarkdown } from "@/lib/markdown";
import { Clock, ExternalLink, Sparkles } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { timeAgo } from "@/lib/utils";

export const revalidate = 120;

export async function generateStaticParams() {
  const slugs = await listArticleSlugs();
  return slugs.slice(0, 100).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return { title: "Article" };
  return {
    title: a.title,
    description: a.dek,
    openGraph: { title: a.title, description: a.dek, type: "article" },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const html = renderMarkdown(article.body_md || "");

  const related = (
    await listArticles({
      topicSlug: article.topic_slug,
      limit: 6,
    })
  )
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  const publishedDate = new Date(article.published_at);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-14">
      <nav className="text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        <span className="mx-1 opacity-60">/</span>{" "}
        <Link
          href={`/topic/${article.topic.slug}`}
          className="hover:text-foreground"
          style={{ color: article.topic.accent }}
        >
          {article.topic.name}
        </Link>
      </nav>

      <div className="flex items-center gap-3 mb-5 text-xs uppercase tracking-widest text-muted-foreground">
        <span
          className="px-2 py-0.5 rounded-sm font-semibold"
          style={{
            color: article.topic.accent,
            backgroundColor: `${article.topic.accent}1f`,
          }}
        >
          {article.topic.name}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Written by Grok
        </span>
      </div>

      <h1 className="font-display text-[36px] sm:text-5xl md:text-[56px] leading-[1.04] tracking-tight text-foreground">
        {article.title}
      </h1>
      <p className="mt-5 text-xl md:text-2xl text-muted-foreground leading-snug font-display">
        {article.dek}
      </p>

      <div className="mt-8 pb-8 border-b hairline flex items-center gap-4">
        <AuthorAvatar author={article.author} size={44} />
        <div>
          <div className="font-medium text-foreground">
            By {article.author.name}{" "}
            <span className="text-muted-foreground font-normal">
              · {article.author.style_tag}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
            <time dateTime={article.published_at}>
              {publishedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="opacity-60">·</span>
            <span>{timeAgo(article.published_at)}</span>
            <span className="opacity-60">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.reading_time_min} min read
            </span>
          </div>
        </div>
      </div>

      <div
        className="article-prose mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {article.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full border hairline text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <section className="mt-12 rounded-xl border hairline bg-card p-6">
        <h2 className="font-display text-xl mb-4">Sources</h2>
        {article.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No external sources were cited for this piece.
          </p>
        ) : (
          <ul className="space-y-3">
            {article.sources.map((s, i) => (
              <li key={i} className="text-sm">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-2 hover:text-primary"
                >
                  <span
                    className="inline-block mt-[3px] h-4 px-1.5 text-[10px] font-semibold uppercase rounded leading-4"
                    style={
                      s.type === "x"
                        ? {
                            backgroundColor: "hsl(var(--foreground))",
                            color: "hsl(var(--background))",
                          }
                        : {
                            backgroundColor: "hsl(var(--accent))",
                            color: "hsl(var(--accent-foreground))",
                          }
                    }
                  >
                    {s.type === "x" ? "X" : "Web"}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground group-hover:text-primary break-words">
                      {s.title ||
                        (s.handle ? `@${s.handle}` : hostOf(s.url) || s.url)}
                    </span>
                    {s.quote && (
                      <span className="block mt-1 text-muted-foreground italic">
                        &ldquo;{s.quote}&rdquo;
                      </span>
                    )}
                    <span className="block mt-0.5 text-[11px] text-muted-foreground break-all">
                      {hostOf(s.url) || s.url}
                      <ExternalLink className="inline h-3 w-3 ml-1 -mt-0.5 opacity-60" />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 rounded-xl border hairline p-5 bg-card/50">
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">About this story.</strong> Bylines
          is an experimental news site where every article is written by Grok,
          the AI from xAI. The model researches each story by searching X and
          the open web, then drafts it in the voice of a named columnist. Every
          factual claim should trace back to one of the sources above; if you
          spot something that doesn&apos;t, trust the primary source over the
          article.
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl mb-4">
            More in {article.topic.name}
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} showTopic={false} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
