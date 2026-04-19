"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import { ALL_SECTIONS_MAP } from "@/lib/sections";
import type { PulsePost, SectionFeed } from "@/lib/types";
import { NewsPod } from "./news-pod";

export type ColumnLayout = 1 | 2 | 3;

interface Props {
  sectionId: string;
  feed: SectionFeed | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onOpenPost: (post: PulsePost, feed: SectionFeed) => void;
  briefingExpanded: boolean;
  onToggleBriefing: () => void;
  onSectionChange: (id: string) => void;
  availableSections: Array<{ id: string; name: string; glyph?: string }>;
  /** How many columns are currently visible in the whole dashboard. */
  columnLayout: ColumnLayout;
  /** Optional ref id to scroll-into-view. */
  anchorId?: string;
}

/**
 * A single column in the dashboard. Has its own category dropdown, Grok
 * briefing, and post list. The number of posts shown per row is derived from
 * the global columnLayout so the total visible pods stay balanced.
 */
export function SectionBlock({
  sectionId,
  feed,
  loading,
  error,
  searchQuery,
  onOpenPost,
  briefingExpanded,
  onToggleBriefing,
  onSectionChange,
  availableSections,
  columnLayout,
  anchorId,
}: Props) {
  const section = ALL_SECTIONS_MAP[sectionId];
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const posts = useMemo(() => {
    if (!feed) return [];
    if (!searchQuery.trim()) return feed.posts;
    const q = searchQuery.toLowerCase();
    return feed.posts.filter(
      (p) =>
        p.text.toLowerCase().includes(q) ||
        p.author_handle.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q),
    );
  }, [feed, searchQuery]);

  if (!section) return null;

  const updatedAtLabel = feed
    ? timeAgo(feed.updated_at, now)
    : loading
      ? "fetching..."
      : "—";

  // Posts-per-row derivation based on total columns shown:
  //   1 col => 3 per row
  //   2 cols => 2 per row (x 2 cols = 4 across the page)
  //   3 cols => 1 per row (x 3 cols = 3 across the page)
  const perRowClass =
    columnLayout === 1
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : columnLayout === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <section
      id={anchorId}
      data-testid={`section-${sectionId}`}
      className="flex flex-col rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm"
    >
      <header className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-b border-border/60">
        <label className="flex items-center gap-2 min-w-0 flex-1">
          <span className="sr-only">Category</span>
          <select
            value={sectionId}
            onChange={(e) => onSectionChange(e.target.value)}
            className={cn(
              "min-w-0 flex-1 appearance-none rounded-md border border-border/70 bg-muted/20 px-3 py-1.5",
              "text-base font-semibold tracking-tight text-foreground",
              "hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
            )}
            data-testid={`section-select-${sectionId}`}
            aria-label="Select category"
          >
            {availableSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.glyph ? `${s.glyph}  ` : ""}
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Badge
          variant="pulse"
          className="gap-1"
          title="Live updated"
          aria-label="Live"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--pulse))] animate-pulse-dot" />
          Live
        </Badge>
      </header>

      <div className="px-4 sm:px-5 pt-2 pb-0 text-[11px] text-muted-foreground">
        updated {updatedAtLabel}
        {feed?.cached ? " · cached" : ""}
        {feed?.demo ? " · demo" : ""}
        {feed?.next_refresh_at
          ? ` · next refresh ${timeAgo(feed.next_refresh_at, now).replace(/ ago$/, "")}`
          : ""}
      </div>

      {feed?.summary?.overview && (
        <BriefingBlock
          summary={feed.summary.overview}
          themes={feed.summary.themes}
          expanded={briefingExpanded}
          onToggle={onToggleBriefing}
        />
      )}

      <div className="px-4 sm:px-5 py-4 flex-1 min-w-0">
        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            Couldn&apos;t load this section: {error}
          </div>
        )}

        {loading && !feed && <PodSkeletons perRowClass={perRowClass} />}

        {feed && posts.length === 0 && !loading && (
          <div className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            No posts match your view right now. Try a wider timeframe.
          </div>
        )}

        {posts.length > 0 && (
          <div
            className={cn("grid gap-4", perRowClass)}
            data-testid={`posts-${sectionId}`}
          >
            {posts.map((p) => (
              <NewsPod
                key={p.id}
                post={p}
                onOpen={() => feed && onOpenPost(p, feed)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BriefingBlock({
  summary,
  themes,
  expanded,
  onToggle,
}: {
  summary: string;
  themes: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-4 sm:px-5 py-2.5 text-left transition",
          "hover:bg-accent/40",
        )}
        data-testid="briefing-toggle"
        aria-expanded={expanded}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Grok briefing
        </span>
        {!expanded && (
          <span className="text-xs text-muted-foreground truncate ml-2 flex-1">
            {summary}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform ml-auto",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <div
          className="px-4 sm:px-5 pb-3 pt-0.5 animate-fade-in"
          data-testid="briefing-content"
        >
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {summary}
          </p>
          {themes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {themes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PodSkeletons({ perRowClass }: { perRowClass: string }) {
  return (
    <div className={cn("grid gap-4", perRowClass)} data-testid="pod-skeletons">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3"
        >
          <div className="skeleton h-36 w-full" />
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
