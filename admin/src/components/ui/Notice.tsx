import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  error: "bg-danger-soft text-danger-ink",
  success: "bg-ok-soft text-ok-ink",
  info: "bg-subtle text-soft",
  warning: "bg-warn-soft text-warn-ink",
};

/** A short message about what just happened or what needs attention. */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium text-pretty",
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
