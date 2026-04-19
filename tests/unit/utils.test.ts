import { describe, it, expect } from "vitest";
import { clamp, compactNumber, timeAgo, uniqueBy } from "../../src/lib/utils";

describe("utils/timeAgo", () => {
  const now = new Date("2025-06-01T12:00:00.000Z").getTime();

  it("returns 'just now' for very recent times", () => {
    expect(timeAgo(now - 3_000, now)).toBe("just now");
  });

  it("formats seconds, minutes, hours, days", () => {
    expect(timeAgo(now - 45_000, now)).toBe("45s ago");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("2d ago");
  });

  it("handles future times gracefully (clamps to 0s)", () => {
    expect(timeAgo(now + 60_000, now)).toBe("just now");
  });
});

describe("utils/compactNumber", () => {
  it("returns plain numbers below 1000", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(999)).toBe("999");
  });

  it("returns K for thousands", () => {
    expect(compactNumber(1_000)).toBe("1.0K");
    expect(compactNumber(1_250)).toBe("1.3K");
    expect(compactNumber(12_345)).toBe("12K");
  });

  it("returns M for millions", () => {
    expect(compactNumber(1_500_000)).toBe("1.5M");
  });

  it("handles null/undefined", () => {
    expect(compactNumber(null)).toBe("0");
    expect(compactNumber(undefined)).toBe("0");
  });
});

describe("utils/clamp", () => {
  it("clamps numbers within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("tolerates swapped min/max arguments", () => {
    expect(clamp(5, 10, 0)).toBe(5);
    expect(clamp(-1, 10, 0)).toBe(0);
  });
});

describe("utils/uniqueBy", () => {
  it("dedupes by key function preserving order", () => {
    const input = [
      { id: "a", v: 1 },
      { id: "b", v: 2 },
      { id: "a", v: 3 },
    ];
    expect(uniqueBy(input, (x) => x.id)).toEqual([
      { id: "a", v: 1 },
      { id: "b", v: 2 },
    ]);
  });
});
