"use client";

import { useEffect, useId, useRef } from "react";
import arcBand from "@/assets/svg/arc-band.svg";
import { cn } from "@/lib/cn";
import { whenSeen } from "@/lib/motion";

type ArcProps = {
  /** Position and size of the bounding box of the turned arc. */
  frame: string;
  spin: string;
  /** Un-rotated size; the mockups use the arc at several sizes. */
  box?: string;
  /** The mockups draw some arcs in a darker violet. */
  dark?: boolean;
  className?: string;
};

const BAND = `url(${arcBand.src})`;

/*
 * The artwork as Figma exports it: a band — two strokes over one another —
 * that fades towards its tail, and a white dot on its head. (arc-band.svg is
 * the same path as a plain shape, for masking the frost.) The band is an arc
 * of a circle, which is what lets it be drawn by turning alone: see `.arc-*`
 * in globals.css for the geometry.
 */
const VIEW_BOX = "0 0 95.5771 119.575";
const STROKE = {
  d: "M67.7073 6.61888C81.4364 47.9139 63.8439 92.0387 27.8697 112.957",
  strokeOpacity: 0.5,
  strokeWidth: 13.2342,
  strokeLinecap: "round",
} as const;

/**
 * The translucent arc with a white dot on its end — an ornament of both
 * layouts. Its band is frosted glass: what lies under it is blurred, by a
 * tenth of the arc's width in Figma's terms (times 0.415 for the CSS sigma,
 * see the note on glass in globals.css). Figma's SVG export cannot carry
 * that, so the frost is a layer of its own, cut to the band.
 *
 * The first time it comes into view the arc is drawn, from the tail to the
 * head: the band grows and the dot rides its tip into place. It is all
 * rotation — a turning clip uncovers the band while the dot orbits the same
 * centre — so the browser animates it without repainting anything.
 */
export function Arc({
  frame,
  spin,
  box = "h-112.25 w-95.5",
  dark = false,
  className,
}: ArcProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return whenSeen(el, () => el.setAttribute("data-seen", ""), 0.9);
  }, []);

  return (
    <div
      ref={ref}
      data-arc=""
      aria-hidden
      className={cn(
        "pointer-events-none absolute flex items-center justify-center",
        frame,
        className,
      )}
    >
      <div className={cn("flex-none", spin)}>
        <div className={cn("relative [container-type:size]", box)}>
          <div className="arc-clip">
            <div className="arc-hold">
              <div className="arc-canvas">
                <div
                  data-arc-frost=""
                  className="absolute inset-0 [backdrop-filter:blur(3.83cqw)] [mask-repeat:no-repeat] [mask-size:100%_100%]"
                  style={{ maskImage: BAND, WebkitMaskImage: BAND }}
                />
                <svg
                  viewBox={VIEW_BOX}
                  preserveAspectRatio="none"
                  fill="none"
                  className="relative block size-full overflow-visible"
                >
                  <path {...STROKE} stroke={`url(#${id}a)`} />
                  <path {...STROKE} stroke={`url(#${id}b)`} />
                  <defs>
                    {dark ? (
                      <linearGradient
                        id={`${id}a`}
                        x1="70.9902"
                        y1="-5.60909"
                        x2="40.4374"
                        y2="125.66"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#240C48" />
                        <stop offset="1" stopColor="#C0E4FF" stopOpacity="0" />
                      </linearGradient>
                    ) : (
                      <linearGradient
                        id={`${id}a`}
                        x1="70.9902"
                        y1="-5.60908"
                        x2="31.8018"
                        y2="110.794"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#8144DB" />
                        <stop offset="1" stopColor="#C0E4FF" stopOpacity="0" />
                      </linearGradient>
                    )}
                    <linearGradient
                      id={`${id}b`}
                      x1="70.9902"
                      y1="-5.60908"
                      x2="31.8018"
                      y2="110.794"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#06020C" />
                      <stop
                        offset="0.697492"
                        stopColor="#EAF6FF"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          <div className="arc-orbit">
            <div className="arc-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
