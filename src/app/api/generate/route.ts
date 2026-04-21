import { NextRequest, NextResponse } from "next/server";
import { env, hasGrok, hasSupabase } from "@/lib/env";
import {
  generateAll,
  generateForTopic,
  generateOnSchedule,
} from "@/lib/generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  if (!env.GENERATE_SECRET) return true; // if no secret set, allow (dev mode)
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.nextUrl.searchParams.get("secret") ?? "";
  if (token && token === env.GENERATE_SECRET) return true;
  // Vercel Cron sends its own signed header; if we're running on Vercel and
  // the request carries it, trust it so operators don't have to configure
  // two secrets.
  if (req.headers.get("x-vercel-cron")) return true;
  return false;
}

async function run(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasGrok() || !hasSupabase()) {
    return NextResponse.json(
      {
        error: "Missing configuration",
        has_grok: hasGrok(),
        has_supabase: hasSupabase(),
      },
      { status: 500 },
    );
  }

  const url = req.nextUrl;
  const topic = url.searchParams.get("topic");
  const scheduleParam = url.searchParams.get("schedule");
  const schedule =
    scheduleParam === "1" ||
    scheduleParam === "true" ||
    Boolean(req.headers.get("x-vercel-cron"));
  const count = Math.max(
    1,
    Math.min(6, Number(url.searchParams.get("count") ?? 3)),
  );
  const dailyCap = Math.max(
    1,
    Math.min(6, Number(url.searchParams.get("daily_cap") ?? 2)),
  );

  try {
    if (schedule) {
      const summary = await generateOnSchedule({
        dailyCapPerTopic: dailyCap,
        perTick: 1,
      });
      return NextResponse.json({ ok: true, schedule: true, summary });
    }
    if (topic) {
      const summary = await generateForTopic({ topicSlug: topic, count });
      return NextResponse.json({ ok: true, summary });
    }
    const summaries = await generateAll(count);
    return NextResponse.json({ ok: true, summaries });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
