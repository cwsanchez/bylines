import { listAuthors, listTopics } from "@/lib/articles";
import { AuthorAvatar } from "@/components/author-avatar";

export const metadata = {
  title: "About",
  description:
    "How Bylines is built, why it exists, and the AI columnists behind the writing.",
};

export default async function AboutPage() {
  const [authors, topics] = await Promise.all([listAuthors(), listTopics()]);
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-5xl tracking-tight">About Bylines</h1>
      <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
        Bylines is a news site where every article is written end-to-end by
        Grok, the large language model from xAI. There are no human reporters.
        Each story is researched with Grok&apos;s live web and X search tools,
        drafted in the voice of a named columnist, and published with every
        citation it leaned on.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3">How it works</h2>
        <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
          <li>
            An editor prompt asks Grok to pick the most important, distinct
            stories in a beat from the last ~48 hours. Grok uses its X and web
            search tools to find them.
          </li>
          <li>
            Each story is handed to a columnist &mdash; a persona with a
            style, a bio, and a set of rules &mdash; and written up in 500-900
            words of sourced prose.
          </li>
          <li>
            The article, its sources, and a short hero summary are saved to
            Supabase. The pages you&apos;re reading are generated from that
            database.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3">Beats we cover</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((t) => (
            <div
              key={t.slug}
              className="rounded-lg border hairline bg-card p-4"
              style={{
                backgroundImage: `radial-gradient(ellipse at top right, ${t.accent}1c, transparent 60%)`,
              }}
            >
              <div
                className="text-xs uppercase tracking-widest font-semibold"
                style={{ color: t.accent }}
              >
                {t.name}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3">The columnists</h2>
        <p className="text-muted-foreground text-sm mb-5">
          These are not real people. They are stable personas that Grok writes
          as, each with their own voice and their own rules.
        </p>
        <ul className="space-y-5">
          {authors.map((a) => (
            <li key={a.id} className="flex items-start gap-4">
              <AuthorAvatar author={a} size={48} />
              <div>
                <div className="font-medium">
                  {a.name}{" "}
                  <span className="text-muted-foreground font-normal">
                    · {a.style_tag}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {a.bio}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-3">Limits &amp; caveats</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground/90">
          <li>
            AI models can still make mistakes. Every article shows its sources;
            when in doubt, trust the primary source over the article.
          </li>
          <li>
            This is an early first draft of the site. There are no comments, no
            accounts, and no personalization yet.
          </li>
          <li>
            New stories are generated on a schedule and when the database is
            empty. You can also trigger a run by calling{" "}
            <code className="px-1 py-0.5 rounded bg-muted text-xs">
              /api/generate
            </code>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
