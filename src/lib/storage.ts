"use client";

import { CORE_SECTION_IDS } from "./sections";
import type { Timeframe } from "./sections";

/**
 * Typed localStorage helpers. All reads are safe on SSR (return default).
 * Writes are a no-op on SSR.
 */

const KEY_SECTIONS = "pulse.sections.v1";
const KEY_COLLAPSED = "pulse.collapsedSummaries.v1";
const KEY_LAST_VISIT = "pulse.lastVisit.v1";
const KEY_TIMEFRAME = "pulse.timeframe.v1";
const KEY_THEME = "pulse.theme.v1";

export const DEFAULT_SECTIONS = CORE_SECTION_IDS;

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

export function loadSections(): string[] {
  const saved = readJson<string[] | null>(KEY_SECTIONS, null);
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    return [...DEFAULT_SECTIONS];
  }
  return saved;
}

export function saveSections(ids: string[]) {
  writeJson(KEY_SECTIONS, ids);
}

export function loadCollapsedMap(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(KEY_COLLAPSED, {});
}
export function saveCollapsedMap(map: Record<string, boolean>) {
  writeJson(KEY_COLLAPSED, map);
}

export function loadLastVisit(): Record<string, string> {
  return readJson<Record<string, string>>(KEY_LAST_VISIT, {});
}
export function saveLastVisit(map: Record<string, string>) {
  writeJson(KEY_LAST_VISIT, map);
}

export function loadTimeframe(): Timeframe {
  const t = readJson<Timeframe | null>(KEY_TIMEFRAME, null);
  return t ?? "24h";
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
