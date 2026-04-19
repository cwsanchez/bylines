import { describe, it, expect } from "vitest";
import {
  ALL_SECTIONS_MAP,
  CORE_SECTIONS,
  STATE_SECTIONS,
  getSection,
  timeframeToHours,
} from "../../src/lib/sections";

describe("sections config", () => {
  it("includes exactly 6 core sections", () => {
    expect(CORE_SECTIONS).toHaveLength(6);
    const ids = CORE_SECTIONS.map((s) => s.id);
    expect(ids).toEqual([
      "international",
      "national",
      "foreign-policy",
      "cybersecurity",
      "tech-news",
      "science",
    ]);
  });

  it("includes all 50 US states", () => {
    expect(STATE_SECTIONS).toHaveLength(50);
    // Every state has a non-empty query
    for (const s of STATE_SECTIONS) {
      expect(s.query.length).toBeGreaterThan(20);
      expect(s.id).toMatch(/^state-/);
    }
  });

  it("maps section ids correctly", () => {
    expect(getSection("international")?.name).toBe("International");
    expect(getSection("state-california")?.name).toBe("California");
    expect(getSection("bogus")).toBeUndefined();
  });

  it("has unique section ids across core + states", () => {
    const ids = Object.keys(ALL_SECTIONS_MAP);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(56);
  });
});

describe("timeframeToHours", () => {
  it("maps timeframe values", () => {
    expect(timeframeToHours("6h")).toBe(6);
    expect(timeframeToHours("24h")).toBe(24);
    expect(timeframeToHours("72h")).toBe(72);
  });
});
