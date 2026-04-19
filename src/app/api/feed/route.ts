import { NextRequest, NextResponse } from "next/server";
import { getSectionFeed } from "@/lib/feed-service";
import type { Timeframe } from "@/lib/sections";
import { TIMEFRAMES, ALL_SECTIONS_MAP } from "@/lib/sections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get("section") ?? "";
  const timeframeRaw = (req.nextUrl.searchParams.get("timeframe") ?? "24h") as Timeframe;
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (!ALL_SECTIONS_MAP[sectionId]) {
    return NextResponse.json(
      { error: "Unknown section", section: sectionId },
      { status: 400 },
    );
  }
  if (!TIMEFRAMES.includes(timeframeRaw)) {
    return NextResponse.json(
      { error: "Invalid timeframe", timeframe: timeframeRaw },
      { status: 400 },
    );
  }

  try {
    const feed = await getSectionFeed({
      sectionId,
      timeframe: timeframeRaw,
      force,
    });
    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[pulse] /api/feed error", err);
    return NextResponse.json(
      { error: "Internal error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
