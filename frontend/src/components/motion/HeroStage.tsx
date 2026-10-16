import type { ReactNode } from "react";

type HeroStageProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
};

/**
 * A page's first screen. All of its motion is CSS (see `hero-*` in
 * globals.css), so it starts with the first paint and does not wait for any
 * script; children opt in with `data-hero-light` / `data-hero-copy` for the
 * entrance. Nothing in it moves with the scroll: the light stays where the
 * mockup has it.
 *
 * The picture of a first screen stands on its floor, so it does not slide
 * after the cursor: it turns towards it, see <Stand>.
 */
export function HeroStage({ children, className, labelledBy }: HeroStageProps) {
  return (
    <section className={className} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}
