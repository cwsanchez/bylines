import { describe, it, expect } from "vitest";
import { buildDemoFeed } from "../../src/lib/demo-data";

describe("buildDemoFeed", () => {
  const now = new Date("2025-06-01T12:00:00.000Z").getTime();

  it("builds a feed for a core section", () => {
    const feed = buildDemoFeed("international", "24h", now);
    expect(feed.section_id).toBe("international");
    expect(feed.timeframe).toBe("24h");
    expect(feed.posts.length).toBeGreaterThan(0);
    expect(feed.demo).toBe(true);
    expect(feed.summary?.overview).toContain("[DEMO]");
  });

  it("respects the timeframe window", () => {
    const short = buildDemoFeed("international", "6h", now);
    const long = buildDemoFeed("international", "72h", now);
    expect(short.posts.length).toBeLessThanOrEqual(long.posts.length);
    for (const p of short.posts) {
      const age = (now - new Date(p.created_at).getTime()) / 3_600_000;
      expect(age).toBeLessThanOrEqual(6);
    }
  });

  it("fabricates plausible state data", () => {
    const feed = buildDemoFeed("state-california", "24h", now);
    expect(feed.posts.length).toBeGreaterThan(0);
    expect(feed.posts[0].section_id).toBe("state-california");
  });
});
