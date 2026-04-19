"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ThemePref } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  theme: ThemePref;
  onThemeChange: (t: ThemePref) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="settings-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Pulse stores your preferences locally on this device — no account
            required. Column and category selections live in the top nav.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-5">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Theme
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(["dark", "light", "system"] as ThemePref[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onThemeChange(t)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm capitalize transition",
                    theme === t
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/70 hover:bg-accent",
                  )}
                  data-testid={`theme-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
            <p>
              Pulse refreshes the <strong>24 Hours</strong> window at the top
              of every hour, <strong>Week</strong> every six hours, and{" "}
              <strong>Month</strong> once a day. You can&apos;t force-refresh
              a feed — the system owns the schedule so X API usage stays
              efficient. Older curated stories are preserved so longer
              windows keep their timeline.
            </p>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
