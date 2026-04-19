import { PulseApp } from "@/components/pulse/app";
import { CORE_SECTIONS } from "@/lib/sections";
import { getSectionFeed } from "@/lib/feed-service";
import { isDemoMode } from "@/lib/env";
import type { SectionFeed } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // Pre-fetch the first couple of core sections server-side so the initial
  // paint feels instant. Remaining sections hydrate client-side.
  const initialFeeds: Record<string, SectionFeed> = {};
  const preload = CORE_SECTIONS.slice(0, 2);
  for (const s of preload) {
    try {
      const feed = await getSectionFeed({
        sectionId: s.id,
        timeframe: "24h",
      });
      initialFeeds[s.id] = feed;
    } catch (err) {
      console.error(`[pulse] preload failed for ${s.id}`, err);
    }
  }

  return <PulseApp initialFeeds={initialFeeds} isDemo={isDemoMode()} />;
}
