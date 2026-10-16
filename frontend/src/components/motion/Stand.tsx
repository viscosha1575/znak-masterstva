"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FINE_POINTER, MOTION_OK, whileMedia } from "@/lib/motion";

type StandProps = {
  children: ReactNode;
  className?: string;
  /** Largest turn towards the cursor, in degrees. */
  turn?: number;
};

/**
 * The picture of a first screen, which stands on the screen's floor. It
 * cannot slide after the cursor the way a free object does: lifted, it comes
 * off what it stands on. So on desktop it turns in depth towards the cursor
 * instead, about the line it stands on, which therefore never moves.
 *
 * The turn is CSS (`[data-stand]` in globals.css): the cursor only sets the
 * angle (`--turn`) and a transition eases the picture to it. At rest the
 * picture stands still, as in the mockup — an idle sway kept the first
 * screen redrawing without end.
 *
 * The line it stands on is the bottom of the box; `--foot` (a length) raises
 * it for a picture that is cut off above its own bottom edge.
 */
export function Stand({ children, className, turn = 5 }: StandProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return whileMedia(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      // Followed only while the picture is on screen.
      let visible = false;
      const watch = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      watch.observe(el);

      const onMove = (event: PointerEvent) => {
        if (!visible) return;
        const share = event.clientX / window.innerWidth;
        el.style.setProperty("--turn", `${(share - 0.5) * 2 * turn}deg`);
        el.setAttribute("data-turning", "");
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        watch.disconnect();
        window.removeEventListener("pointermove", onMove);
      };
    });
  }, [turn]);

  return (
    <div ref={ref} data-stand="turn" className={className}>
      {children}
    </div>
  );
}
