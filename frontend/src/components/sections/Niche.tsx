import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The lit niche a first screen's object stands in, running up under the
 * header. Its background reaches the edges of the screen, past the frame the
 * page is laid out in (`--bleed`, see globals.css); what stands in it is
 * placed against the frame.
 *
 * In the mockup the edge of the screen cuts the render off on the right. On
 * a screen wider than the frame there is more of it to see, and then its own
 * edge, so past the frame's edge it fades out into the niche.
 */
export function Niche({
  className,
  children,
}: {
  /** The niche's height. */
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-x-0 top-0 overflow-clip bg-linear-to-b/srgb from-black to-violet-deep/95 md:-inset-x-(--bleed)",
        className,
      )}
    >
      <div className="absolute inset-0 md:[mask-image:linear-gradient(to_right,#000_calc(100%_-_var(--bleed)),transparent_calc(100%_-_var(--bleed)_+_var(--u)*50))]">
        <div className="absolute inset-0 md:inset-x-(--bleed)">{children}</div>
      </div>
    </div>
  );
}
