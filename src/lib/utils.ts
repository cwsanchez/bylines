import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-friendly relative time (e.g. "3m ago", "2h ago", "1d ago").
 * Deterministic: given the same pair of timestamps it always returns the same value.
 */
export function timeAgo(
  date: Date | string | number,
  now: Date | number = Date.now(),
): string {
  const then = typeof date === "number" ? date : new Date(date).getTime();
  const currentMs = typeof now === "number" ? now : now.getTime();
  const diffSec = Math.max(0, Math.floor((currentMs - then) / 1000));

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
}

/** Compact engagement numbers: 1200 -> "1.2K" */
export function compactNumber(n: number | null | undefined): string {
  if (!n || n < 1000) return `${n ?? 0}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
}

/** Clamp with correct ordering regardless of input. */
export function clamp(n: number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.min(Math.max(n, lo), hi);
}

/** Deduplicate by a keying function, preserving first occurrence order. */
export function uniqueBy<T, K>(items: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const it of items) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}
