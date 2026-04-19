import { describe, it, expect } from "vitest";
import {
  ALL_SECTIONS_MAP,
  CORE_SECTIONS,
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  getSection,
  timeframeToHours,
} from "../../src/lib/sections";

describe("sections config", () => {
  it("includes exactly 8 curated categories", () => {
    expect(CORE_SECTIONS).toHaveLength(8);
    const ids = CORE_SECTIONS.map((s) => s.id);
    expect(ids).toEqual([
      "international",
      "foreign-policy",
      "us-politics",
      "us-general",
      "cybersecurity",
      "tech-news",
      "science",
      "pop-culture",
    ]);
  });

  it("no state-level sections remain", () => {
    const ids = Object.keys(ALL_SECTIONS_MAP);
    for (const id of ids) {
      expect(id.startsWith("state-")).toBe(false);
    }
  });

  it("maps section ids correctly", () => {
    expect(getSection("international")?.name).toBe("International");
    expect(getSection("us-politics")?.name).toBe("US Politics");
    expect(getSection("pop-culture")?.name).toBe("Pop Culture & Entertainment");
    expect(getSection("bogus")).toBeUndefined();
  });

  it("has unique ids and non-trivial queries", () => {
    const ids = Object.keys(ALL_SECTIONS_MAP);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of CORE_SECTIONS) {
      expect(s.query.length).toBeGreaterThan(40);
    }
  });
});

describe("timeframes", () => {
  it("exposes 24h / week / month", () => {
    expect(TIMEFRAMES).toEqual(["24h", "week", "month"]);
    expect(TIMEFRAME_LABELS["24h"]).toBe("24 Hours");
    expect(TIMEFRAME_LABELS.week).toBe("Week");
    expect(TIMEFRAME_LABELS.month).toBe("Month");
  });

  it("maps timeframe values to hours", () => {
    expect(timeframeToHours("24h")).toBe(24);
    expect(timeframeToHours("week")).toBe(168);
    expect(timeframeToHours("month")).toBe(720);
  });
});
