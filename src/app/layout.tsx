import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — a calmer, smarter news reader",
  description:
    "Pulse is a premium, readable news dashboard that turns verified X posts into a clean, scannable daily briefing with AI-generated summaries.",
  openGraph: {
    title: "Pulse",
    description:
      "A beautiful news reader powered by X and Grok. Read everything that matters, in one calm place.",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#060818" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
