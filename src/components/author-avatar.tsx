import type { Author } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AuthorAvatar({
  author,
  size = 28,
  className = "",
}: {
  author: Author;
  size?: number;
  className?: string;
}) {
  const hue = author.avatar_hue ?? 220;
  const bg = `hsl(${hue} 70% 48%)`;
  const bg2 = `hsl(${(hue + 40) % 360} 80% 40%)`;
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full text-white font-medium ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg2})`,
        fontSize: size * 0.38,
      }}
    >
      {initials(author.name)}
    </span>
  );
}
