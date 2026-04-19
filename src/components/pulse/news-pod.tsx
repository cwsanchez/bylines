"use client";

import { Heart, MessageCircle, Repeat2, CheckCircle2 } from "lucide-react";
import type { PulsePost } from "@/lib/types";
import { cn, compactNumber, timeAgo } from "@/lib/utils";

interface Props {
  post: PulsePost;
  onOpen: (post: PulsePost) => void;
}

export function NewsPod({ post, onOpen }: Props) {
  const firstMedia = post.media[0];
  const snippet = post.text;

  return (
    <article
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border/60",
        "bg-card/70 hover:bg-card transition-all duration-200",
        "hover:border-primary/40 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_8px_30px_-8px_hsl(var(--primary)/0.18)]",
        "animate-fade-in",
      )}
      onClick={() => onOpen(post)}
      data-testid="news-pod"
    >
      {firstMedia && firstMedia.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={firstMedia.preview_url ?? firstMedia.url}
          alt={firstMedia.alt_text ?? ""}
          loading="lazy"
          className="w-full h-auto max-h-72 object-cover bg-muted/40"
        />
      )}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80 truncate">
            {post.author_name}
          </span>
          {post.author_verified && (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verified" />
          )}
          <span className="truncate">@{post.author_handle}</span>
          <span className="mx-0.5">·</span>
          <span className="whitespace-nowrap">{timeAgo(post.created_at)}</span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-foreground line-clamp-3">
          {snippet}
        </h3>

        {post.why_it_matters ? (
          <p
            className="text-xs text-muted-foreground/90 italic leading-snug line-clamp-2"
            data-testid="why-it-matters"
          >
            <span className="text-primary not-italic font-medium mr-1">
              Why:
            </span>
            {post.why_it_matters}
          </p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {compactNumber(post.metrics.like_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              {compactNumber(post.metrics.retweet_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {compactNumber(post.metrics.reply_count)}
            </span>
          </div>
          <span className="text-xs text-primary/80 font-medium opacity-0 group-hover:opacity-100 transition">
            Read more →
          </span>
        </div>
      </div>
    </article>
  );
}
