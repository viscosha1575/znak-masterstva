import type { CSSProperties } from "react";
import { ART } from "@/assets/art";
import { Picture } from "@/components/ui/Picture";
import { cn } from "@/lib/cn";

type StreakProps = {
  /** Position and size of the rotated artwork's bounding box (mobile, then `md:`). */
  frame: string;
  spin: string;
  box: string;
  /** Set where the streak is visible on first paint, so it is not lazy-loaded. */
  eager?: boolean;
  /**
   * Where the desktop mockup masks the streak off, in design pixels of the
   * streak's frame (`streak-mask` in globals.css): left, top and — where the
   * mask ends above the page's end — bottom edges, and `right`, where the
   * layout frame ends.
   */
  mask?: { left: number; top: number; right: number; bottom?: number };
};

/**
 * The wide band of light that crosses the lower half of a page. It stands
 * still, where the mockup puts it: moved with the scroll, it slid against its
 * mask and showed the mask's straight edge, and its rays reaching to and fro
 * kept the page — and the glass over it — redrawing without end.
 */
export function Streak({ frame, spin, box, eager, mask }: StreakProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute flex items-center justify-center",
        frame,
        mask && "streak-mask",
      )}
      style={
        mask &&
        ({
          "--mask-l": mask.left,
          "--mask-t": mask.top,
          "--mask-r": mask.right,
          "--mask-b": mask.bottom,
        } as CSSProperties)
      }
    >
      <div className="flex-none">
        <div className={spin}>
          <div className={cn("relative", box)}>
            {/*
             * The artwork is several screens wide but it is soft light, so it
             * is declared far smaller than it is drawn: nobody can tell, and
             * a phone fetches a ~1000px file instead of a 2700px one.
             */}
            <Picture
              art={ART.streak}
              sizes="(width < 48rem) 120vw, 100vw"
              preload={eager}
              className="absolute inset-0 size-full object-cover"
            />
            {/*
             * Fades the artwork into the page colour, as in the mockup. The
             * gradient is laid on a box larger than the artwork, as when its
             * edge still slid to and fro, so that it falls where it did; the
             * clip keeps it from covering anything outside the artwork.
             */}
            <div className="absolute -inset-px overflow-clip">
              <div className="absolute -inset-[15%] bg-[linear-gradient(-64.45deg,var(--color-ink)_40.009%,transparent_53.385%)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
