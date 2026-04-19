"use client";

import {
  CheckCircle2,
  ExternalLink,
  Heart,
  MessageCircle,
  Repeat2,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PulsePost, PulseSummary } from "@/lib/types";
import { compactNumber, timeAgo } from "@/lib/utils";

interface Props {
  post: PulsePost | null;
  summary: PulseSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function PostModal({ post, summary, onOpenChange }: Props) {
  const takeaways =
    post && summary?.takeaways?.[post.id]
      ? summary.takeaways[post.id]
      : null;

  return (
    <Dialog open={Boolean(post)} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0"
        data-testid="post-modal"
      >
        {post && (
          <>
            <div className="overflow-y-auto scrollbar-thin flex-1 px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-border/60 flex items-center justify-center text-sm font-bold">
                  {post.author_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-foreground truncate">
                      {post.author_name}
                    </p>
                    {post.author_verified && (
                      <CheckCircle2
                        className="h-4 w-4 text-primary"
                        aria-label="Verified"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{post.author_handle} · {timeAgo(post.created_at)}
                  </p>
                </div>
                <Badge variant="pulse" className="gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--pulse))] animate-pulse-dot" />
                  Live
                </Badge>
              </div>

              <div
                className="prose-pulse whitespace-pre-wrap"
                data-testid="post-modal-text"
              >
                {post.text.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {post.media.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg overflow-hidden">
                  {post.media.slice(0, 4).map((m, i) => {
                    if (m.type === "video") {
                      return (
                        <video
                          key={i}
                          src={m.url}
                          poster={m.preview_url ?? undefined}
                          controls
                          className="w-full rounded-lg bg-black"
                        />
                      );
                    }
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={m.preview_url ?? m.url}
                        alt={m.alt_text ?? ""}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground border-t border-border/60 pt-3">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {compactNumber(post.metrics.like_count)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Repeat2 className="h-4 w-4" />
                  {compactNumber(post.metrics.retweet_count)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  {compactNumber(post.metrics.reply_count)}
                </span>
                {post.metrics.impression_count ? (
                  <span className="ml-auto text-xs text-muted-foreground/80">
                    {compactNumber(post.metrics.impression_count)} impressions
                  </span>
                ) : null}
              </div>

              {takeaways && takeaways.length > 0 && (
                <section
                  className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4"
                  data-testid="post-modal-takeaways"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Grok key takeaways
                  </h4>
                  <ul className="space-y-1.5 text-sm text-foreground/90">
                    {takeaways.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {summary?.overview && (
                <p className="mt-4 text-xs text-muted-foreground italic">
                  Context for this section: {summary.overview}
                </p>
              )}
            </div>

            <DialogFooter>
              {post.url ? (
                <Button
                  asChild
                  variant="default"
                  data-testid="read-full-article"
                >
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Read full article
                  </a>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                data-testid="open-on-x"
              >
                <a
                  href={post.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open on X
                </a>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
