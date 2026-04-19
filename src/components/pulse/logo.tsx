import { cn } from "@/lib/utils";

export function PulseLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="text-primary"
      >
        <rect width="64" height="64" rx="14" className="fill-primary/10" />
        <path
          d="M8 36 L18 36 L22 22 L30 48 L38 28 L44 40 L56 40"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">
        Pulse
      </span>
    </div>
  );
}
