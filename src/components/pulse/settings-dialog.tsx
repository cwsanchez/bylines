"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ALL_SECTIONS_MAP, CORE_SECTIONS } from "@/lib/sections";
import type { ThemePref } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sections: string[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  theme: ThemePref;
  onThemeChange: (t: ThemePref) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  sections,
  onReorder,
  onRemove,
  theme,
  onThemeChange,
}: Props) {
  const [dragging, setDragging] = useState<string | null>(null);

  function handleDragStart(id: string) {
    setDragging(id);
  }
  function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const next = [...sections];
    const from = next.indexOf(dragging);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragging);
    onReorder(next);
    setDragging(null);
  }

  const coreIds = new Set(CORE_SECTIONS.map((s) => s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="settings-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage visible sections, drag to reorder, and switch theme. Your
            preferences are stored locally — Pulse never tracks you across
            devices.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-5">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Visible sections
            </h3>
            <ul className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin rounded-md border border-border/60 p-1">
              {sections.map((id) => {
                const s = ALL_SECTIONS_MAP[id];
                if (!s) return null;
                const core = coreIds.has(id);
                return (
                  <li
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(id)}
                    onDragEnd={() => setDragging(null)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm border border-transparent",
                      "hover:border-border bg-muted/20",
                      dragging === id && "opacity-60",
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {core ? "Core" : s.glyph ?? "State"}
                    </span>
                    {!core && (
                      <button
                        type="button"
                        onClick={() => onRemove(id)}
                        className="p-1 rounded-md hover:bg-destructive/15 hover:text-destructive"
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
