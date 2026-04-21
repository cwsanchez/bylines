import Link from "next/link";
import { listTopics } from "@/lib/articles";

export async function TopicRail({ active }: { active?: string }) {
  const topics = await listTopics();
  return (
    <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <nav className="flex gap-1 text-sm w-max">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded-full border hairline transition-colors ${
            !active
              ? "bg-foreground text-background border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </Link>
        {topics.map((t) => {
          const on = active === t.slug;
          return (
            <Link
              key={t.slug}
              href={`/topic/${t.slug}`}
              className={`px-3 py-1.5 rounded-full border hairline transition-colors ${
                on
                  ? "text-background border-transparent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                on
                  ? { backgroundColor: t.accent }
                  : undefined
              }
            >
              {t.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
