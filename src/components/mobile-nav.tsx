"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Topic } from "@/lib/types";

export function MobileNav({ topics }: { topics: Topic[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-background border-l hairline p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-3 border-b hairline">
              <span className="font-display text-lg">Topics</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>
              {topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/topic/${t.slug}`}
                  className="px-3 py-2 rounded-md text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {t.name}
                </Link>
              ))}
              <Link
                href="/about"
                className="px-3 py-2 rounded-md text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
