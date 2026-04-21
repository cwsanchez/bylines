import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t hairline">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="font-display text-lg text-foreground">Bylines</div>
          <div className="text-xs mt-1 max-w-md">
            Every article on Bylines is written end-to-end by Grok, the AI from
            xAI. Stories are researched from posts on X and the open web, and
            every piece lists its sources.
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/archive" className="hover:text-foreground">
            Archive
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/api/status" className="hover:text-foreground">
            Status
          </Link>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  );
}
