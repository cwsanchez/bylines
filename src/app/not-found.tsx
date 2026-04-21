import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        404
      </div>
      <h1 className="font-display text-5xl tracking-tight mt-2">
        We can&apos;t find that page.
      </h1>
      <p className="mt-3 text-muted-foreground">
        The article may have been unpublished, or the link is off by a letter.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
