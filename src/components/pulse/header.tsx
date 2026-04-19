"use client";

import { Columns, Columns2, Columns3, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseLogo } from "./logo";
import { cn } from "@/lib/utils";
import {
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type Timeframe,
} from "@/lib/sections";
import type { ColumnCount } from "@/lib/storage";

interface Props {
  onOpenSettings: () => void;
  onSearch: (value: string) => void;
  searchValue: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  columnCount: ColumnCount;
  onColumnCountChange: (n: ColumnCount) => void;
}

const COLUMN_OPTIONS: Array<{ n: ColumnCount; Icon: typeof Columns }> = [
  { n: 1, Icon: Columns },
  { n: 2, Icon: Columns2 },
  { n: 3, Icon: Columns3 },
];

export function Header({
  onOpenSettings,
  onSearch,
  searchValue,
  timeframe,
  onTimeframeChange,
  columnCount,
  onColumnCountChange,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <PulseLogo />

        <div
          className={cn(
            "ml-4 hidden md:flex items-center gap-2 flex-1 max-w-sm",
            "rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5",
            "focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20 transition",
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search headlines, sources, topics..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
            data-testid="global-search"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* Timeframe selector */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline uppercase tracking-wider">
              Window
            </span>
            <select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
              className="rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-sm text-foreground hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="timeframe-select"
              aria-label="Select time window"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {TIMEFRAME_LABELS[tf]}
                </option>
              ))}
            </select>
          </label>

          {/* Column-count toggle */}
          <div
            className="flex items-center rounded-md border border-border/70 bg-muted/30 p-0.5"
            role="group"
            aria-label="Columns"
            data-testid="column-count-toggle"
          >
            {COLUMN_OPTIONS.map(({ n, Icon }) => (
              <button
                key={n}
                type="button"
                onClick={() => onColumnCountChange(n)}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-[5px] text-muted-foreground transition",
                  columnCount === n
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-accent/60 hover:text-foreground",
                )}
                aria-label={`${n} column${n > 1 ? "s" : ""}`}
                aria-pressed={columnCount === n}
                data-testid={`column-count-${n}`}
                title={`${n} column${n > 1 ? "s" : ""}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label="Open settings"
            data-testid="open-settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
