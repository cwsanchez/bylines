import { notFound } from "next/navigation";
import { listArticles, listTopics } from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";
import { TimeframeSwitch } from "@/components/timeframe-switch";
import { TopicRail } from "@/components/topic-rail";
import type { Timeframe } from "@/lib/types";
import type { Metadata } from "next";

function parseTimeframe(v?: string): Timeframe {
  if (v === "week" || v === "month") return v;
  return "24h";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topics = await listTopics();
  const t = topics.find((x) => x.slug === slug);
  if (!t) return { title: "Topic" };
  return {
    title: t.name,
    description: t.description,
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;
  const tf = parseTimeframe(t);

  const [topics, articles] = await Promise.all([
    listTopics(),
    listArticles({ topicSlug: slug, timeframe: tf, limit: 60 }),
  ]);
  const topic = topics.find((x) => x.slug === slug);
  if (!topic) notFound();

  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10">
      <div className="mb-6">
        <TopicRail active={topic.slug} />
      </div>

      <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: topic.accent }}
          >
            Topic
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-1">
            {topic.name}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {topic.description}
          </p>
        </div>
        <TimeframeSwitch current={tf} basePath={`/topic/${topic.slug}`} />
      </section>

      {articles.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-10 text-center">
          <h2 className="font-display text-2xl">Nothing here yet</h2>
          <p className="mt-2 text-muted-foreground">
            No {topic.name} stories in this window. Try expanding the
            timeframe.
          </p>
        </div>
      ) : (
        <>
          {lead && (
            <div className="mb-10">
              <ArticleCard article={lead} size="lead" showTopic={false} />
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                size="standard"
                showTopic={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
