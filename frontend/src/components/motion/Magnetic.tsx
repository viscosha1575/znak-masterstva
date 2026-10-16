"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FINE_POINTER, MOTION_OK, whileMedia } from "@/lib/motion";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** Share of the cursor offset the element follows (0–1). */
  strength?: number;
};

/**
 * Pulls its content towards the cursor while hovered, and springs back on
 * leave. The cursor sets the offset; the easing — and the overshoot of the
 * spring — are transitions on `[data-magnetic]` in globals.css.
 */
export function Magnetic({
  children,
  className,
  strength = 0.25,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return whileMedia(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      let rect: DOMRect | null = null;
      const forget = () => (rect = null);

      const onMove = (event: PointerEvent) => {
        if (!rect) {
          // Its own offset must not count as part of where it is.
          el.style.translate = "";
          rect = el.getBoundingClientRect();
          window.addEventListener("scroll", forget, {
            passive: true,
            once: true,
          });
        }
        const x = (event.clientX - rect.left - rect.width / 2) * strength;
        const y = (event.clientY - rect.top - rect.height / 2) * strength;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      };
      const onLeave = () => {
        forget();
        window.removeEventListener("scroll", forget);
        el.style.translate = "";
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("scroll", forget);
      };
    });
  }, [strength]);

  return (
    <div ref={ref} data-magnetic="" className={className}>
      {children}
    </div>
  );
}
