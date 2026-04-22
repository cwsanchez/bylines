import { listArticles, listTopics } from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";
import { TimeframeSwitch } from "@/components/timeframe-switch";
import { TopicRail } from "@/components/topic-rail";
import type { Timeframe } from "@/lib/types";
import Link from "next/link";

type Search = { t?: string };

function parseTimeframe(v?: string): Timeframe {
  if (v === "week" || v === "month") return v;
  return "24h";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const tf = parseTimeframe(params.t);
  const [all, topics] = await Promise.all([
    listArticles({ timeframe: tf, limit: 80 }),
    listTopics(),
  ]);

  const lead = all[0];
  const sub = all.slice(1, 5);
  const rest = all.slice(5);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10">
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            The news, reported by Grok.
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Every story on Bylines is researched from X posts and the open web,
            then written by an AI columnist with a named voice. Sources are at
            the bottom of every article.
          </p>
        </div>
        <TimeframeSwitch current={tf} basePath="/" />
      </section>

      <div className="mb-8">
        <TopicRail />
      </div>

      {all.length === 0 ? (
        <EmptyState tf={tf} />
      ) : (
        <>
          {lead && (
            <div className="mb-10">
              <ArticleCard article={lead} size="lead" />
            </div>
          )}

          {sub.length > 0 && (
            <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {sub.map((a) => (
                <ArticleCard key={a.id} article={a} size="feature" />
              ))}
            </section>
          )}

          {topics.map((topic) => {
            const topicArticles = rest.filter((a) => a.topic_slug === topic.slug);
            if (topicArticles.length === 0) return null;
            return (
              <section key={topic.slug} className="mb-12">
                <div className="flex items-end justify-between mb-4">
                  <h2 className="font-display text-2xl">
                    <Link
                      href={`/topic/${topic.slug}`}
                      className="hover:underline underline-offset-4 decoration-1"
                      style={{ color: topic.accent }}
                    >
                      {topic.name}
                    </Link>
                  </h2>
                  <Link
                    href={`/topic/${topic.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    More {topic.name.toLowerCase()} →
                  </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {topicArticles.slice(0, 3).map((a) => (
                    <ArticleCard key={a.id} article={a} size="standard" />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function EmptyState({ tf }: { tf: Timeframe }) {
  const label =
    tf === "24h" ? "the last 24 hours" : tf === "week" ? "this week" : "this month";
  return (
    <div className="rounded-xl border hairline bg-card p-10 text-center">
      <h2 className="font-display text-2xl">No articles yet</h2>
      <p className="mt-2 text-muted-foreground">
        Nothing has been published in {label}. The newsroom rotates through the
        beats every four hours &mdash; check back soon, peek at the{" "}
        <a href="/archive" className="underline underline-offset-4">
          archive
        </a>
        , or trigger a run with{" "}
        <code className="px-1.5 py-0.5 rounded bg-muted text-sm">
          POST /api/generate
        </code>
        .
      </p>
    </div>
  );
}
