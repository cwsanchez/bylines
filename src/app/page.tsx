import { PulseApp } from "@/components/pulse/app";
import { CORE_SECTIONS } from "@/lib/sections";
import { getSectionFeed } from "@/lib/feed-service";
import { isDemoMode } from "@/lib/env";
import type { SectionFeed } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // Pulse now starts with a single-column view. Preload just the default
  // first category (International) so initial paint feels instant without
  // hammering X on every request.
  const initialFeeds: Record<string, SectionFeed> = {};
  const [first] = CORE_SECTIONS;
  if (first) {
    try {
      const feed = await getSectionFeed({
        sectionId: first.id,
        timeframe: "24h",
      });
      initialFeeds[first.id] = feed;
    } catch (err) {
      console.error(`[pulse] preload failed for ${first.id}`, err);
    }
  }

  return <PulseApp initialFeeds={initialFeeds} isDemo={isDemoMode()} />;
}
