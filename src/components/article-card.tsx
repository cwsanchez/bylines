import Link from "next/link";
import type { ArticleWithAuthor } from "@/lib/types";
import { AuthorAvatar } from "./author-avatar";
import { Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Size = "lead" | "feature" | "standard" | "compact";

export function ArticleCard({
  article,
  size = "standard",
  showTopic = true,
}: {
  article: ArticleWithAuthor;
  size?: Size;
  showTopic?: boolean;
}) {
  const href = `/article/${article.slug}`;

  if (size === "lead") {
    return (
      <Link
        href={href}
        className="group block rounded-xl bg-card border hairline p-6 sm:p-8 md:p-10 hover:border-primary/60 transition-colors"
        style={{
          backgroundImage: `radial-gradient(ellipse at top right, ${article.topic.accent}15, transparent 60%)`,
        }}
      >
        <div className="flex items-center gap-3 mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          {showTopic && (
            <span
              className="px-2 py-0.5 rounded-sm font-semibold"
              style={{
                color: article.topic.accent,
                backgroundColor: `${article.topic.accent}1f`,
              }}
            >
              {article.topic.name}
            </span>
          )}
          <span>{timeAgo(article.published_at)}</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight text-foreground group-hover:underline underline-offset-[6px] decoration-1">
          {article.title}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl line-clamp-3">
          {article.dek}
        </p>
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <AuthorAvatar author={article.author} size={32} />
          <span className="font-medium text-foreground">
            {article.author.name}
          </span>
          <span>·</span>
          <span className="italic">{article.author.style_tag}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.reading_time_min} min read
          </span>
        </div>
      </Link>
    );
  }

  if (size === "compact") {
    return (
      <Link
        href={href}
        className="group flex gap-3 py-3 border-b hairline last:border-b-0"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            {showTopic && (
              <span style={{ color: article.topic.accent }}>
                {article.topic.name}
              </span>
            )}
            <span>·</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>
          <h3 className="mt-1 font-display text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="mt-1 text-xs text-muted-foreground">
            {article.author.name}
          </div>
        </div>
      </Link>
    );
  }

  const featured = size === "feature";

  return (
    <Link
      href={href}
      className="group block rounded-xl bg-card border hairline p-5 hover:border-primary/50 transition-colors h-full"
    >
      <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {showTopic && (
          <span
            className="font-semibold"
            style={{ color: article.topic.accent }}
          >
            {article.topic.name}
          </span>
        )}
        <span>·</span>
        <span>{timeAgo(article.published_at)}</span>
      </div>
      <h3
        className={`font-display leading-tight tracking-tight text-foreground group-hover:underline underline-offset-4 decoration-1 ${
          featured
            ? "text-2xl sm:text-[26px] line-clamp-3"
            : "text-xl line-clamp-3"
        }`}
      >
        {article.title}
      </h3>
      <p
        className={`mt-2 text-sm text-muted-foreground ${
          featured ? "line-clamp-3" : "line-clamp-3"
        }`}
      >
        {article.dek}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <AuthorAvatar author={article.author} size={22} />
        <span className="font-medium text-foreground">
          {article.author.name}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {article.reading_time_min} min
        </span>
      </div>
    </Link>
  );
}
