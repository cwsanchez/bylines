"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, timeAgo } from "@/lib/utils";
import { ALL_SECTIONS_MAP, TIMEFRAMES, type Timeframe } from "@/lib/sections";
import type { PulsePost, SectionFeed } from "@/lib/types";
import { NewsPod } from "./news-pod";

interface Props {
  sectionId: string;
  feed: SectionFeed | null;
  loading: boolean;
  error: string | null;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onRefresh: () => void;
  searchQuery: string;
  onOpenPost: (post: PulsePost, feed: SectionFeed) => void;
  summaryCollapsed: boolean;
  onToggleSummary: () => void;
  /** Optional ref id to scroll-into-view from sidebar clicks. */
  anchorId?: string;
}

export function SectionBlock({
  sectionId,
  feed,
  loading,
  error,
  timeframe,
  onTimeframeChange,
  onRefresh,
  searchQuery,
  onOpenPost,
  summaryCollapsed,
  onToggleSummary,
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

  return (
    <section
      id={anchorId}
      data-testid={`section-${sectionId}`}
      className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm"
    >
      <header className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          {section.glyph && (
            <span className="text-sm opacity-70" aria-hidden>
              {section.glyph}
            </span>
          )}
          <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate">
            {section.name}
          </h2>
          <Badge
            variant="pulse"
            className="gap-1 ml-1"
            title="Live updated"
            aria-label="Live"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--pulse))] animate-pulse-dot" />
            Live
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          updated {updatedAtLabel}
          {feed?.cached ? " · cached" : ""}
          {feed?.demo ? " · demo" : ""}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Tabs
            value={timeframe}
            onValueChange={(v) => onTimeframeChange(v as Timeframe)}
          >
            <TabsList>
              {TIMEFRAMES.map((tf) => (
                <TabsTrigger
                  key={tf}
                  value={tf}
                  data-testid={`timeframe-${sectionId}-${tf}`}
                >
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label={`Refresh ${section.name}`}
            data-testid={`refresh-${sectionId}`}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {feed?.summary?.overview && (
        <SummaryBlock
          summary={feed.summary.overview}
          themes={feed.summary.themes}
          collapsed={summaryCollapsed}
          onToggle={onToggleSummary}
        />
      )}

      <div className="px-4 sm:px-5 py-4">
        {error && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            Couldn&apos;t load this section: {error}
          </div>
        )}

        {loading && !feed && <PodSkeletons />}

        {feed && posts.length === 0 && !loading && (
          <div className="rounded-lg border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            No posts match your view right now. Try a wider timeframe.
          </div>
        )}

        {posts.length > 0 && (
          <div
            className="masonry masonry-3"
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

function SummaryBlock({
  summary,
  themes,
  collapsed,
  onToggle,
}: {
  summary: string;
  themes: string[];
  collapsed: boolean;
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
        data-testid="summary-toggle"
        aria-expanded={!collapsed}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Grok briefing
        </span>
        {collapsed && (
          <span className="text-xs text-muted-foreground truncate ml-2 flex-1">
            {summary}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform ml-auto",
            !collapsed && "rotate-180",
          )}
        />
      </button>
      {!collapsed && (
        <div
          className="px-4 sm:px-5 pb-3 pt-0.5 animate-fade-in"
          data-testid="summary-content"
        >
          <p className="text-sm leading-relaxed text-foreground/90">
            {summary}
          </p>
          {themes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
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

function PodSkeletons() {
  return (
    <div className="masonry masonry-3" data-testid="pod-skeletons">
      {[0, 1, 2, 3, 4, 5].map((i) => (
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
