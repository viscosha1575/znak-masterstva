import type { ReactNode } from "react";
import { FrameWatch } from "@/components/motion/FrameWatch";
import { cn } from "@/lib/cn";

type PageProps = {
  children: ReactNode;
  /** The form page is the one light screen in an otherwise dark site. */
  tone?: "dark" | "light";
};

/**
 * Page canvas. `main` clips the oversized background artwork; the inner box is
 * the design frame everything is positioned against (`--frame` in
 * globals.css: the 1920 mockup, scaled).
 *
 * The frame includes the header and the top of the footer: both have rounded
 * corners and lie over the page, so `main` starts at the very top of the
 * screen and runs on under the footer. Positions are therefore measured from
 * the top of the mockup frame, and every page ends with room for the footer's
 * overlap.
 */
export function Page({ children, tone = "dark" }: PageProps) {
  return (
    <main
      className={cn(
        "relative -mt-(--header-h) overflow-clip pb-30 md:pb-50",
        tone === "light" && "bg-white text-ink",
      )}
    >
      <div className="relative mx-auto max-w-(--frame)">{children}</div>
      {/* Last, so that it starts counting once the page above is hydrated. */}
      <FrameWatch />
    </main>
  );
}
