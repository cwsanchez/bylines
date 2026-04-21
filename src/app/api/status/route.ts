import { NextResponse } from "next/server";
import { getAnonSupabase, getServiceSupabase } from "@/lib/supabase";
import { hasGrok, hasSupabase } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supa = getAnonSupabase() ?? getServiceSupabase();
  const counts: Record<string, number> = {};
  let latest: string | null = null;

  if (supa) {
    const { data: rows } = await supa
      .from("articles")
      .select("topic_slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);
    for (const r of rows ?? []) {
      counts[r.topic_slug] = (counts[r.topic_slug] ?? 0) + 1;
      if (!latest || r.published_at > latest) latest = r.published_at;
    }
  }

  return NextResponse.json({
    has_grok: hasGrok(),
    has_supabase: hasSupabase(),
    counts,
    latest_published_at: latest,
  });
}
