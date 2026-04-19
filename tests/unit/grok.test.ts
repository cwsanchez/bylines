import { describe, it, expect } from "vitest";
import { hashIds } from "../../src/lib/grok";

describe("hashIds", () => {
  it("returns the same hash for the same ids in any order", () => {
    expect(hashIds(["a", "b", "c"])).toBe(hashIds(["c", "a", "b"]));
  });

  it("returns different hashes for different id sets", () => {
    expect(hashIds(["a", "b"])).not.toBe(hashIds(["a", "b", "c"]));
  });

  it("is non-empty for empty input", () => {
    expect(hashIds([])).toBeTruthy();
  });
});
