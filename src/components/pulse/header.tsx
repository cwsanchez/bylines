"use client";

import { RefreshCw, Search, Settings2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PulseLogo } from "./logo";
import { cn } from "@/lib/utils";

interface Props {
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onSearch: (value: string) => void;
  searchValue: string;
  isRefreshing?: boolean;
}

export function Header({
  onRefresh,
  onOpenSettings,
  onToggleSidebar,
  onSearch,
  searchValue,
  isRefreshing,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          data-testid="toggle-sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <PulseLogo />

        <div
          className={cn(
            "ml-4 hidden md:flex items-center gap-2 flex-1 max-w-md",
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

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Refresh all sections"
            data-testid="refresh-all"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
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
