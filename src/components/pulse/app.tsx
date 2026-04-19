"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./header";
import { SectionBlock } from "./section-block";
import { PostModal } from "./post-modal";
import { SettingsDialog } from "./settings-dialog";
import { NewsPod } from "./news-pod";
import {
  ALL_SECTIONS_MAP,
  CORE_SECTIONS,
  type Timeframe,
} from "@/lib/sections";
import type { PulsePost, PulseSummary, SectionFeed } from "@/lib/types";
import {
  DEFAULT_COLUMN_SECTIONS,
  loadBriefingExpanded,
  loadColumnCount,
  loadColumnSections,
  loadLastVisit,
  loadTheme,
  loadTimeframe,
  saveBriefingExpanded,
  saveColumnCount,
  saveColumnSections,
  saveLastVisit,
  saveTheme,
  saveTimeframe,
  type ColumnCount,
  type ThemePref,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

interface FeedMapEntry {
  feed: SectionFeed | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_ENTRY: FeedMapEntry = {
  feed: null,
  loading: true,
  error: null,
};

interface PulseAppProps {
  initialFeeds?: Record<string, SectionFeed>;
  isDemo?: boolean;
}

/**
 * Polling cadence: the system refreshes each visible feed at the top of the
 * hour for 24h views, every 6 hours for week, and every 24 hours for month.
 * We also poll at app level every 5 minutes to pick up server-side updates
 * without forcing the user to reload.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function PulseApp({ initialFeeds = {}, isDemo }: PulseAppProps) {
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [theme, setTheme] = useState<ThemePref>("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnCount, setColumnCount] = useState<ColumnCount>(1);
  const [columnSections, setColumnSections] = useState<string[]>(() => [
    ...DEFAULT_COLUMN_SECTIONS.slice(0, 3),
  ]);
  const [briefingExpanded, setBriefingExpanded] = useState<
    Record<string, boolean>
  >({});
  const [feeds, setFeeds] = useState<Record<string, FeedMapEntry>>(() => {
    const map: Record<string, FeedMapEntry> = {};
    for (const [sid, f] of Object.entries(initialFeeds)) {
      map[sid] = { feed: f, loading: false, error: null };
    }
    return map;
  });

  const [openPost, setOpenPost] = useState<{
    post: PulsePost;
    summary: PulseSummary | null;
  } | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setColumnCount(loadColumnCount());
    setColumnSections(loadColumnSections());
    setBriefingExpanded(loadBriefingExpanded());
    setTimeframe(loadTimeframe());
    setTheme(loadTheme());
    setMounted(true);

    const lv = loadLastVisit();
    lv["__app__"] = new Date().toISOString();
    saveLastVisit(lv);
  }, []);

  // Apply theme.
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle("dark", dark);
    };
    if (theme === "dark") apply(true);
    else if (theme === "light") apply(false);
    else {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mql.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme, mounted]);

  // Persist when changed.
  useEffect(() => {
    if (mounted) saveColumnCount(columnCount);
  }, [columnCount, mounted]);
  useEffect(() => {
    if (mounted) saveColumnSections(columnSections);
  }, [columnSections, mounted]);
  useEffect(() => {
    if (mounted) saveBriefingExpanded(briefingExpanded);
  }, [briefingExpanded, mounted]);
  useEffect(() => {
    if (mounted) saveTimeframe(timeframe);
  }, [timeframe, mounted]);
  useEffect(() => {
    if (mounted) saveTheme(theme);
  }, [theme, mounted]);

  /**
   * The categories currently shown on screen, in column order.
   */
  const visibleSections = useMemo(
    () =>
      columnSections
        .slice(0, columnCount)
        .filter((id) => ALL_SECTIONS_MAP[id]),
    [columnSections, columnCount],
  );

  const fetchFeed = useCallback(
    async (sectionId: string, tf: Timeframe) => {
      setFeeds((prev) => ({
        ...prev,
        [sectionId]: {
          feed: prev[sectionId]?.feed ?? null,
          loading: true,
          error: null,
        },
      }));
      try {
        const res = await fetch(
          `/api/feed?section=${encodeURIComponent(sectionId)}&timeframe=${tf}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const feed = (await res.json()) as SectionFeed;
        setFeeds((prev) => ({
          ...prev,
          [sectionId]: { feed, loading: false, error: null },
        }));
      } catch (err) {
        setFeeds((prev) => ({
          ...prev,
          [sectionId]: {
            feed: prev[sectionId]?.feed ?? null,
            loading: false,
            error: (err as Error).message,
          },
        }));
      }
    },
    [],
  );

  // Load visible feeds whenever the visible set or timeframe changes.
  useEffect(() => {
    if (!mounted) return;
    for (const id of visibleSections) {
      const existing = feeds[id]?.feed;
      const tfMatches = existing && existing.timeframe === timeframe;
      if (!tfMatches && !feeds[id]?.loading) {
        fetchFeed(id, timeframe);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSections, timeframe, mounted]);

  // Background polling: re-request visible feeds periodically. The server
  // owns the actual refresh cadence (hourly for 24h, etc.); this just pulls
  // the newest cached snapshot into the UI.
  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => {
      for (const sid of visibleSections) {
        fetchFeed(sid, timeframe);
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [visibleSections, timeframe, mounted, fetchFeed]);

  const toggleBriefing = useCallback((sectionId: string) => {
    setBriefingExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  /**
   * Changing the category in a column. Keep other columns' selections stable.
   */
  const setColumnSection = useCallback(
    (index: number, newId: string) => {
      setColumnSections((prev) => {
        const next = [...prev];
        // Pad to length 3.
        while (next.length < 3) {
          const candidate =
            DEFAULT_COLUMN_SECTIONS.find((id) => !next.includes(id)) ??
            DEFAULT_COLUMN_SECTIONS[0];
          next.push(candidate);
        }
        // If newId is already in another visible column, swap them so every
        // visible column shows a distinct category.
        const existingIdx = next.indexOf(newId);
        if (existingIdx !== -1 && existingIdx !== index && existingIdx < columnCount) {
          next[existingIdx] = next[index];
        }
        next[index] = newId;
        return next;
      });
    },
    [columnCount],
  );

  /**
   * Changing column count. When growing, auto-fill new slots with the next
   * category the user isn't already viewing.
   */
  const handleColumnCountChange = useCallback((n: ColumnCount) => {
    setColumnCount(n);
    setColumnSections((prev) => {
      const next = [...prev];
      // Ensure every slot up to n is a section that isn't duplicated.
      const seen = new Set<string>();
      for (let i = 0; i < n; i++) {
        const current = next[i];
        if (current && ALL_SECTIONS_MAP[current] && !seen.has(current)) {
          seen.add(current);
          continue;
        }
        // pick the first core section not yet used
        const pick =
          DEFAULT_COLUMN_SECTIONS.find(
            (id) => !seen.has(id) && !next.slice(0, i).includes(id),
          ) ?? DEFAULT_COLUMN_SECTIONS[0];
        next[i] = pick;
        seen.add(pick);
      }
      // Pad tail so we always persist 3 slots.
      while (next.length < 3) {
        const candidate =
          DEFAULT_COLUMN_SECTIONS.find((id) => !next.includes(id)) ??
          DEFAULT_COLUMN_SECTIONS[0];
        next.push(candidate);
      }
      return next.slice(0, 3);
    });
  }, []);

  const gridColsClass =
    columnCount === 1
      ? "grid-cols-1"
      : columnCount === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  const sectionOptions = CORE_SECTIONS.map((s) => ({
    id: s.id,
    name: s.name,
    glyph: s.glyph,
  }));

  // Global search fallback: when the user types in the search box, show a
  // merged list of matching posts across all visible feeds, above the columns.
  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ post: PulsePost; feed: SectionFeed }> = [];
    for (const sid of visibleSections) {
      const feed = feeds[sid]?.feed;
      if (!feed) continue;
      for (const p of feed.posts) {
        if (
          p.text.toLowerCase().includes(q) ||
          p.author_handle.toLowerCase().includes(q) ||
          p.author_name.toLowerCase().includes(q)
        ) {
          results.push({ post: p, feed });
        }
      }
    }
    return results;
  }, [feeds, visibleSections, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        columnCount={columnCount}
        onColumnCountChange={handleColumnCountChange}
      />

      <main
        className="flex-1 px-3 sm:px-5 lg:px-8 py-5 md:py-7 space-y-5"
        data-testid="main-feed"
      >
        {isDemo && (
          <div
            className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/90 flex items-center gap-3 animate-fade-in"
            data-testid="demo-banner"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
            <p className="leading-snug">
              <strong className="font-semibold">Demo mode.</strong> Pulse is
              running on hand-crafted sample posts because no X API key is
              configured. Add <code className="text-xs">X_BEARER_TOKEN</code>{" "}
              and <code className="text-xs">XAI_API_KEY</code> to your{" "}
              <code className="text-xs">.env.local</code> to pull live posts
              and AI briefings.
            </p>
          </div>
        )}

        {searchQuery.trim() && globalSearchResults.length > 0 && (
          <section
            className="rounded-2xl border border-border/60 bg-card/40 px-4 sm:px-5 py-4"
            data-testid="search-results"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Search · {globalSearchResults.length} match
                {globalSearchResults.length === 1 ? "" : "es"}
              </h2>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </button>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {globalSearchResults.slice(0, 9).map(({ post, feed }) => (
                <NewsPod
                  key={`${feed.section_id}-${post.id}`}
                  post={post}
                  onOpen={() =>
                    setOpenPost({ post, summary: feed.summary })
                  }
                />
              ))}
            </div>
          </section>
        )}

        <div
          className={cn("grid gap-4 lg:gap-5", gridColsClass)}
          data-testid="columns-grid"
        >
          {visibleSections.map((id, i) => {
            const entry = feeds[id] ?? INITIAL_ENTRY;
            return (
              <div
                key={`col-${i}-${id}`}
                ref={(el) => {
                  sectionRefs.current[id] = el;
                }}
              >
                <SectionBlock
                  sectionId={id}
                  feed={entry.feed}
                  loading={entry.loading}
                  error={entry.error}
                  searchQuery={searchQuery}
                  onOpenPost={(post, feed) =>
                    setOpenPost({ post, summary: feed.summary })
                  }
                  briefingExpanded={briefingExpanded[id] ?? false}
                  onToggleBriefing={() => toggleBriefing(id)}
                  onSectionChange={(newId) => setColumnSection(i, newId)}
                  availableSections={sectionOptions}
                  columnLayout={columnCount}
                  anchorId={`section-${id}`}
                />
              </div>
            );
          })}
        </div>

        {visibleSections.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No categories selected. Pick categories from the column dropdowns
            above.
          </div>
        )}

        <footer className="pt-6 pb-10 text-center text-xs text-muted-foreground">
          <p>
            Pulse is an open-source project (MIT). All posts belong to their
            authors. Pulse is not affiliated with X.
          </p>
        </footer>
      </main>

      <PostModal
        post={openPost?.post ?? null}
        summary={openPost?.summary ?? null}
        onOpenChange={(open) => !open && setOpenPost(null)}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
