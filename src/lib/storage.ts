"use client";

import { CORE_SECTION_IDS, type Timeframe } from "./sections";

/**
 * Typed localStorage helpers. All reads are safe on SSR (return default).
 * Writes are a no-op on SSR.
 */

const KEY_COLUMN_COUNT = "pulse.columnCount.v2";
const KEY_COLUMN_SECTIONS = "pulse.columnSections.v2";
const KEY_BRIEFING_EXPANDED = "pulse.briefingExpanded.v2";
const KEY_TIMEFRAME = "pulse.timeframe.v2";
const KEY_THEME = "pulse.theme.v1";
const KEY_LAST_VISIT = "pulse.lastVisit.v2";

export type ColumnCount = 1 | 2 | 3;

/**
 * Default column roster. When the user goes from 1 -> 2 -> 3 columns we fill
 * in from DEFAULT_COLUMN_SECTIONS, picking the first category that isn't
 * already displayed.
 */
export const DEFAULT_COLUMN_SECTIONS: string[] = [...CORE_SECTION_IDS];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode; swallow
  }
}

export function loadColumnCount(): ColumnCount {
  const v = readJson<number | null>(KEY_COLUMN_COUNT, null);
  if (v === 1 || v === 2 || v === 3) return v;
  return 1;
}
export function saveColumnCount(n: ColumnCount) {
  writeJson(KEY_COLUMN_COUNT, n);
}

/**
 * Which category is shown in each column slot. We always persist a length-3
 * array (one slot per possible column) so switching column counts doesn't
 * lose the user's selections.
 */
export function loadColumnSections(): string[] {
  const saved = readJson<string[] | null>(KEY_COLUMN_SECTIONS, null);
  if (saved && Array.isArray(saved) && saved.length >= 1) {
    const padded = [...saved];
    while (padded.length < 3) {
      const next = DEFAULT_COLUMN_SECTIONS.find((id) => !padded.includes(id));
      if (!next) break;
      padded.push(next);
    }
    return padded.slice(0, 3);
  }
  // Default slots: first 3 categories.
  return DEFAULT_COLUMN_SECTIONS.slice(0, 3);
}
export function saveColumnSections(ids: string[]) {
  writeJson(KEY_COLUMN_SECTIONS, ids);
}

export function loadBriefingExpanded(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(KEY_BRIEFING_EXPANDED, {});
}
export function saveBriefingExpanded(map: Record<string, boolean>) {
  writeJson(KEY_BRIEFING_EXPANDED, map);
}

export function loadLastVisit(): Record<string, string> {
  return readJson<Record<string, string>>(KEY_LAST_VISIT, {});
}
export function saveLastVisit(map: Record<string, string>) {
  writeJson(KEY_LAST_VISIT, map);
}

export function loadTimeframe(): Timeframe {
  const t = readJson<Timeframe | null>(KEY_TIMEFRAME, null);
  if (t === "24h" || t === "week" || t === "month") return t;
  return "24h";
}
export function saveTimeframe(t: Timeframe) {
  writeJson(KEY_TIMEFRAME, t);
}

export type ThemePref = "dark" | "light" | "system";
export function loadTheme(): ThemePref {
  return readJson<ThemePref>(KEY_THEME, "dark");
}
export function saveTheme(t: ThemePref) {
  writeJson(KEY_THEME, t);
}
