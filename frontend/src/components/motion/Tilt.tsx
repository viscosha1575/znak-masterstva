"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { FINE_POINTER, MOTION_OK, whileMedia } from "@/lib/motion";

type TiltProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Maximum lean towards the cursor, in degrees. */
  max?: number;
};

/** How long the card takes to settle back (the transition in globals.css), in ms. */
const SETTLE = 950;

/**
 * Leans a card towards the cursor and slides a soft highlight under it
 * (`.tilt-light`). Meant for a card that clips its content.
 *
 * The cursor only sets the angles (`--tilt-x`, `--tilt-y`) and the place of
 * the highlight; the lean itself is a CSS transition on `[data-tilt]`, which
 * the browser eases on its own — no script runs between two movements of the
 * mouse, and nothing is repainted. The card is a 3D layer only while it is
 * tilted (`data-tilting`).
 */
export function Tilt({
  as: Tag = "div",
  children,
  className,
  max = 2,
  ...rest
}: TiltProps & Record<`data-${string}`, string>) {
  const ref = useRef<HTMLElement>(null);
  const light = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const spot = light.current;
    if (!el || !spot) return;

    return whileMedia(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      let rect: DOMRect | null = null;
      let settle: ReturnType<typeof setTimeout>;
      const forget = () => (rect = null);

      const onMove = (event: PointerEvent) => {
        // Measured once per visit of the cursor, while the card is still
        // flat: measuring a leaning card on every move would both cost a
        // layout and feed the lean back into itself. A scroll under a
        // resting cursor moves the card, so it asks for a new measure.
        if (!rect) {
          rect = el.getBoundingClientRect();
          window.addEventListener("scroll", forget, {
            passive: true,
            once: true,
          });
        }
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;

        clearTimeout(settle);
        el.style.setProperty("--tilt-y", `${(px - 0.5) * 2 * max}deg`);
        el.style.setProperty("--tilt-x", `${(0.5 - py) * 2 * max}deg`);
        el.setAttribute("data-tilting", "");
        spot.style.translate = `${px * rect.width}px ${py * rect.height}px`;
        spot.style.opacity = "1";
      };

      const onLeave = () => {
        forget();
        window.removeEventListener("scroll", forget);
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
        spot.style.opacity = "";
        settle = setTimeout(() => el.removeAttribute("data-tilting"), SETTLE);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        clearTimeout(settle);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("scroll", forget);
      };
    });
  }, [max]);

  return (
    <Tag ref={ref} data-tilt="" className={className} {...rest}>
      {children}
      <span ref={light} aria-hidden className="tilt-light" />
    </Tag>
  );
}
