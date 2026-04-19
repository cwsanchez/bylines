"use client";

import { useState } from "react";
import {
  ChevronLeft,
  GripVertical,
  Plus,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ALL_SECTIONS_MAP, STATE_SECTIONS } from "@/lib/sections";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onToggle: () => void;
  sections: string[];
  activeSection: string | null;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
}

export function Sidebar({
  open,
  onToggle,
  sections,
  activeSection,
  onSelect,
  onReorder,
  onRemove,
  onAdd,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function handleDragStart(id: string) {
    setDragging(id);
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setDragOver(id);
  }
  function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const next = [...sections];
    const from = next.indexOf(dragging);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragging);
    onReorder(next);
    setDragging(null);
    setDragOver(null);
  }

  return (
    <>
      <aside
        className={cn(
          "z-20 md:z-10 shrink-0",
          "bg-card/90 md:bg-transparent backdrop-blur-sm",
          "border-r border-border/70",
          // Desktop: sticky column, always visible
          "md:sticky md:top-14 md:left-0 md:h-[calc(100vh-3.5rem)] md:w-72",
          // Mobile: fixed overlay; slide off-screen when closed
          "fixed top-14 w-72 h-[calc(100vh-3.5rem)]",
          "transition-all duration-200 ease-out",
          open ? "left-0" : "-left-72 md:left-0",
        )}
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sections
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-7 w-7"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-8rem)] scrollbar-thin">
          <ul className="px-2 pb-2 space-y-0.5" data-testid="section-list">
            {sections.map((id) => {
              const section = ALL_SECTIONS_MAP[id];
              if (!section) return null;
              const isActive = id === activeSection;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(id)}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDrop={() => handleDrop(id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setDragOver(null);
                  }}
                  className={cn(
                    "group relative",
                    dragOver === id && dragging !== id && "ring-1 ring-primary/40 rounded-md",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition-colors",
                      "hover:bg-accent/60",
                      isActive &&
                        "bg-accent text-accent-foreground font-medium",
                    )}
                    data-testid={`section-link-${id}`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing" />
                    <span className="truncate flex-1">{section.name}</span>
                    {section.group === "state" && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {section.glyph}
                      </span>
                    )}
                    {section.group === "state" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(id);
                        }}
                        className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive transition"
                        aria-label={`Remove ${section.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <div className="absolute inset-x-3 bottom-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setAddOpen(true)}
            data-testid="add-section"
          >
            <Plus className="h-4 w-4" />
            Add a US state
          </Button>
        </div>
      </aside>

      {/* Mobile backdrop - only on small screens, only when sidebar is open */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 top-14 z-10 bg-black/40 md:hidden"
          onClick={onToggle}
          aria-label="Close sidebar overlay"
          data-testid="sidebar-backdrop"
        />
      )}

      <AddStateDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        activeSections={sections}
        onAdd={(id) => {
          onAdd(id);
          setAddOpen(false);
        }}
      />

    </>
  );
}

function AddStateDialog({
  open,
  onOpenChange,
  activeSections,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeSections: string[];
  onAdd: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const active = new Set(activeSections);
  const filtered = STATE_SECTIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.abbr.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        data-testid="add-state-dialog"
      >
        <DialogHeader>
          <DialogTitle>Add a US state section</DialogTitle>
          <DialogDescription>
            Each state has a hand-tuned X search query that blends local
            outlets, city names, and key keywords.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-1.5 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              placeholder="Filter states..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
              data-testid="state-filter"
            />
          </div>
          <ScrollArea className="h-80 -mx-6 px-6 scrollbar-thin">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pb-4">
              {filtered.map((s) => {
                const id = `state-${s.slug}`;
                const alreadyAdded = active.has(id);
                return (
                  <li key={s.slug}>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => onAdd(id)}
                      data-testid={`add-state-${s.slug}`}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm text-left transition",
                        alreadyAdded
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent hover:border-primary/40",
                      )}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {alreadyAdded ? "Added" : s.abbr}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No states match &ldquo;{query}&rdquo;.
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
