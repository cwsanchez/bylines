"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { SectionBlock } from "./section-block";
import { PostModal } from "./post-modal";
import { SettingsDialog } from "./settings-dialog";
import { ALL_SECTIONS_MAP, CORE_SECTION_IDS, type Timeframe } from "@/lib/sections";
import type { PulsePost, PulseSummary, SectionFeed } from "@/lib/types";
import {
  DEFAULT_SECTIONS,
  loadCollapsedMap,
  loadLastVisit,
  loadSections,
  loadTheme,
  loadTimeframe,
  saveCollapsedMap,
  saveLastVisit,
  saveSections,
  saveTheme,
  saveTimeframe,
  type ThemePref,
} from "@/lib/storage";

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

export function PulseApp({ initialFeeds = {}, isDemo }: PulseAppProps) {
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState<string[]>(() => [...DEFAULT_SECTIONS]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [theme, setTheme] = useState<ThemePref>("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSummaries, setCollapsedSummaries] = useState<
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

  const [refreshing, setRefreshing] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setSections(loadSections());
    setCollapsedSummaries(loadCollapsedMap());
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
    if (mounted) saveSections(sections);
  }, [sections, mounted]);
  useEffect(() => {
    if (mounted) saveCollapsedMap(collapsedSummaries);
  }, [collapsedSummaries, mounted]);
  useEffect(() => {
    if (mounted) saveTimeframe(timeframe);
  }, [timeframe, mounted]);
  useEffect(() => {
    if (mounted) saveTheme(theme);
  }, [theme, mounted]);

  // Fetch missing feeds.
  const fetchFeed = useCallback(
    async (sectionId: string, tf: Timeframe, force = false) => {
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
          `/api/feed?section=${encodeURIComponent(sectionId)}&timeframe=${tf}${force ? "&force=1" : ""}`,
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

  useEffect(() => {
    if (!mounted) return;
    for (const id of sections) {
      const existing = feeds[id]?.feed;
      const tfMatches = existing && existing.timeframe === timeframe;
      if (!tfMatches && !feeds[id]?.loading) {
        fetchFeed(id, timeframe);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, timeframe, mounted]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(sections.map((id) => fetchFeed(id, timeframe, true)));
    setRefreshing(false);
  }, [sections, timeframe, fetchFeed]);

  const toggleSummary = useCallback((sectionId: string) => {
    setCollapsedSummaries((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true),
    }));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s !== id));
    setFeeds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addSection = useCallback((id: string) => {
    setSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
    // Trigger scroll after render.
    requestAnimationFrame(() => {
      const el = sectionRefs.current[id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const onSelectSection = useCallback((id: string) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sectionEntries = useMemo(
    () =>
      sections
        .filter((id) => ALL_SECTIONS_MAP[id])
        .map((id) => ({ id, entry: feeds[id] ?? INITIAL_ENTRY })),
    [sections, feeds],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        isRefreshing={refreshing}
        onRefresh={refreshAll}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
      />

      <div className="flex-1 flex">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((s) => !s)}
          sections={sections}
          activeSection={activeSection}
          onSelect={onSelectSection}
          onReorder={setSections}
          onRemove={removeSection}
          onAdd={addSection}
        />

        <main
          className="flex-1 min-w-0 px-3 sm:px-5 md:pl-8 md:pr-6 py-6 md:py-8 space-y-6"
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
                and AI summaries.
              </p>
            </div>
          )}

          {sectionEntries.map(({ id, entry }) => (
            <div
              key={id}
              ref={(el) => {
                sectionRefs.current[id] = el;
              }}
            >
              <SectionBlock
                sectionId={id}
                feed={entry.feed}
                loading={entry.loading}
                error={entry.error}
                timeframe={timeframe}
                onTimeframeChange={(tf) => {
                  setTimeframe(tf);
                  fetchFeed(id, tf);
                }}
                onRefresh={() => fetchFeed(id, timeframe, true)}
                searchQuery={searchQuery}
                onOpenPost={(post, feed) =>
                  setOpenPost({ post, summary: feed.summary })
                }
                summaryCollapsed={
                  collapsedSummaries[id] ?? true /* collapsed by default */
                }
                onToggleSummary={() => toggleSummary(id)}
                anchorId={`section-${id}`}
              />
            </div>
          ))}

          {sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No sections yet. Add your first one from the sidebar.
            </div>
          )}

          <footer className="pt-6 pb-10 text-center text-xs text-muted-foreground">
            <p>
              Pulse is an open-source project (MIT). All posts belong to their
              authors. Pulse is not affiliated with X.
            </p>
          </footer>
        </main>
      </div>

      <PostModal
        post={openPost?.post ?? null}
        summary={openPost?.summary ?? null}
        onOpenChange={(open) => !open && setOpenPost(null)}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        sections={sections}
        onReorder={setSections}
        onRemove={removeSection}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

// Suppress unused warnings - CORE_SECTION_IDS is used via storage defaults.
void CORE_SECTION_IDS;
