import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  gray: "bg-subtle text-ink",
  green: "bg-ok-soft text-ok-ink",
  red: "bg-danger-soft text-danger-ink",
  orange: "bg-warn-soft text-warn-ink",
  blue: "bg-info-soft text-info-ink",
  purple: "bg-violet-soft text-violet-ink",
  brand: "bg-brand text-white",
};

export type BadgeTone = keyof typeof tones;

/**
 * A small pill: a status, a tag, a count. Capitals by default; `verbatim`
 * keeps the text as written, for values where case means something.
 */
export function Badge({
  tone = "gray",
  children,
  className,
  title,
  verbatim,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
  verbatim?: boolean;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-1.5 text-xs leading-none font-bold tracking-normal whitespace-nowrap",
        !verbatim && "uppercase",
        tones[tone],
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
