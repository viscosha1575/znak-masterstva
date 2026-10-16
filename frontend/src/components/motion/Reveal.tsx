"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { MOTION_OK, whenSeen } from "@/lib/motion";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Animate the `[data-reveal-item]` descendants one after another instead of the element itself. */
  group?: boolean;
  /** Travel distance, in design pixels. */
  y?: number;
  delay?: number;
  stagger?: number;
  /** How far down the viewport the element's top must be to start: 0 is the top edge, 1 the bottom. */
  line?: number;
};

/** Length of the transition in globals.css (`[data-reveal]`), in seconds. */
const DURATION = 1.2;

/**
 * Fades content up into place the first time it scrolls into view.
 *
 * The movement itself is a CSS transition (see `[data-reveal]` in
 * globals.css): this only marks the element — or the items of a group — as
 * seen, and once the transition is over as done, which hands the element's
 * `transition` back to its own classes.
 */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  group = false,
  y = 56,
  delay = 0,
  stagger = 0.1,
  line = 0.86,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(MOTION_OK).matches) return;

    const targets = group
      ? [...el.querySelectorAll<HTMLElement>("[data-reveal-item]")]
      : [el];
    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-i", String(index));
    });

    let timer: ReturnType<typeof setTimeout>;
    const forget = whenSeen(
      el,
      () => {
        for (const target of targets) target.setAttribute("data-seen", "");
        const total = delay + stagger * (targets.length - 1) + DURATION;
        timer = setTimeout(
          () => {
            for (const target of targets) {
              target.setAttribute("data-seen", "done");
            }
          },
          total * 1000 + 100,
        );
      },
      line,
    );

    return () => {
      forget();
      clearTimeout(timer);
    };
  }, [group, delay, stagger, line]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={
        {
          "--reveal-y": y,
          "--reveal-delay": `${delay}s`,
          "--reveal-stagger": `${stagger}s`,
        } as CSSProperties
      }
      {...(group ? {} : { "data-reveal": "" })}
    >
      {children}
    </Tag>
  );
}
