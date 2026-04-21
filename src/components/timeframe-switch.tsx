import Link from "next/link";
import type { Timeframe } from "@/lib/types";

const LABELS: Record<Timeframe, string> = {
  "24h": "24 hours",
  week: "Week",
  month: "Month",
};

export function TimeframeSwitch({
  current,
  basePath,
}: {
  current: Timeframe;
  basePath: string;
}) {
  const options: Timeframe[] = ["24h", "week", "month"];
  return (
    <div className="inline-flex items-center rounded-md border hairline bg-card p-0.5">
      {options.map((opt) => {
        const active = opt === current;
        const href =
          opt === "24h" ? basePath : `${basePath}?t=${opt}`;
        return (
          <Link
            key={opt}
            href={href}
            className={`px-3 py-1.5 text-xs font-medium rounded-[5px] transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {LABELS[opt]}
          </Link>
        );
      })}
    </div>
  );
}
