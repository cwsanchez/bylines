import Link from "next/link";
import type { Metadata } from "next";
import {
  ARCHIVE_AFTER_DAYS,
  listArchiveArticles,
  listTopics,
} from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every Bylines story older than 30 days, browsable by topic and page.",
};

const PAGE_SIZE = 24;

function parsePage(v?: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; topic?: string }>;
}) {
  const { page: pageRaw, topic: topicSlug } = await searchParams;
  const page = parsePage(pageRaw);
  const offset = (page - 1) * PAGE_SIZE;

  const [topics, result] = await Promise.all([
    listTopics(),
    listArchiveArticles({
      topicSlug: topicSlug || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
  ]);

  const { articles, total } = result;
  const activeTopic = topicSlug
    ? topics.find((t) => t.slug === topicSlug)
    : undefined;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (next: { page?: number; topic?: string | null }) => {
    const parts: string[] = [];
    const t = next.topic === null ? undefined : next.topic ?? topicSlug;
    if (t) parts.push(`topic=${encodeURIComponent(t)}`);
    const p = next.page ?? page;
    if (p > 1) parts.push(`page=${p}`);
    return parts.length ? `?${parts.join("&")}` : "";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10">
      <section className="mb-8">
        <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Archive
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-1">
          {activeTopic ? `${activeTopic.name} archive` : "The archive"}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Stories older than {ARCHIVE_AFTER_DAYS} days that have rolled off the
          home page. Everything Bylines has ever published is kept here, newest
          first.
        </p>
      </section>

      <nav
        aria-label="Filter archive by topic"
        className="mb-8 -mx-4 sm:mx-0 overflow-x-auto"
      >
        <div className="flex items-center gap-1 px-4 sm:px-0 min-w-max">
          <ArchiveTopicLink
            href={`/archive${qs({ topic: null, page: 1 })}`}
            label="All"
            active={!activeTopic}
          />
          {topics.map((t) => (
            <ArchiveTopicLink
              key={t.slug}
              href={`/archive?topic=${t.slug}`}
              label={t.name}
              color={t.accent}
              active={activeTopic?.slug === t.slug}
            />
          ))}
        </div>
      </nav>

      {articles.length === 0 ? (
        <div className="rounded-xl border hairline bg-card p-10 text-center">
          <h2 className="font-display text-2xl">Nothing in the archive yet</h2>
          <p className="mt-2 text-muted-foreground">
            {activeTopic
              ? `No ${activeTopic.name} stories are older than ${ARCHIVE_AFTER_DAYS} days.`
              : `No stories are older than ${ARCHIVE_AFTER_DAYS} days yet. Check back later.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                size="standard"
                showTopic={!activeTopic}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            hrefForPage={(p) => `/archive${qs({ page: p })}`}
          />
        </>
      )}
    </div>
  );
}

function ArchiveTopicLink({
  href,
  label,
  color,
  active,
}: {
  href: string;
  label: string;
  color?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
      style={active && color ? { backgroundColor: color, color: "white" } : undefined}
    >
      {label}
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-10 text-sm text-muted-foreground text-center">
        {total} {total === 1 ? "story" : "stories"} in the archive.
      </p>
    );
  }

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="Archive pagination"
      className="mt-10 flex items-center justify-between gap-4"
    >
      {prev ? (
        <Link
          href={hrefForPage(prev)}
          className="px-3 py-1.5 rounded-md border hairline text-sm hover:bg-accent"
        >
          ← Newer
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md border hairline text-sm text-muted-foreground opacity-50">
          ← Newer
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {total}{" "}
        {total === 1 ? "story" : "stories"}
      </span>
      {next ? (
        <Link
          href={hrefForPage(next)}
          className="px-3 py-1.5 rounded-md border hairline text-sm hover:bg-accent"
        >
          Older →
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-md border hairline text-sm text-muted-foreground opacity-50">
          Older →
        </span>
      )}
    </nav>
  );
}
