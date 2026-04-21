import Link from "next/link";
import { listTopics } from "@/lib/articles";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const topics = await listTopics();
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b hairline">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2 md:gap-6">
            <Link
              href="/"
              className="flex items-baseline gap-2 font-display text-[22px] leading-none tracking-tight"
            >
              <span className="font-semibold">Bylines</span>
              <span className="text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hidden sm:inline">
                written by Grok
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {topics.map((t) => (
              <Link
                key={t.slug}
                href={`/topic/${t.slug}`}
                className="px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileNav topics={topics} />
          </div>
        </div>
      </div>
    </header>
  );
}
