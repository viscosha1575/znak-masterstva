"use client";

import { useId, useState } from "react";
import chevron from "@/assets/svg/chevron-panel.svg";
import chevronMute from "@/assets/svg/chevron-panel-mute.svg";
import chevronMobile from "@/assets/svg/m-chevron.svg";
import { Reveal } from "@/components/motion/Reveal";
import { Collapse } from "@/components/ui/Collapse";
import { NOMINATIONS, type Nomination } from "@/content/nominations";
import { cn } from "@/lib/cn";
import { lines } from "@/lib/lines";

/** One nomination: a glass pane headed by its name, which opens on its brief and judging criteria. */
function Panel({ nomination }: { nomination: Nomination }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <li
      data-reveal-item=""
      className="glass glass-mirrored overflow-clip rounded-(--pane-r) bg-night/5 [--glass-blur:1.66] [--pane-r:calc(var(--u)*12)] md:[--glass-blur:3.8] md:[--pane-r:calc(var(--u)*30)]"
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "group relative flex h-35 w-full cursor-pointer items-center justify-between gap-12 rounded-[inherit] bg-night/5 px-10 text-left transition-colors duration-300 hover:bg-violet/12 md:h-80 md:px-30",
            // Closed, the bar is all there is of the pane and the pane's own edge is its edge.
            open && "glass-head glass-mirrored",
          )}
        >
          <span
            className={cn(
              "t-body transition-colors duration-300",
              open ? "text-white" : "text-mute group-hover:text-white",
            )}
          >
            {nomination.title}
          </span>
          <span className="flex h-10 w-14 shrink-0 items-center justify-center md:h-22 md:w-48">
            <picture
              className={cn(
                "flex-none transition-[rotate] duration-500 ease-out-expo",
                open ? "-rotate-90" : "rotate-90",
              )}
            >
              {/* Closed, the desktop mockup draws the chevron in grey. */}
              <source
                media="(width >= 48rem)"
                srcSet={open ? chevron.src : chevronMute.src}
              />
              <img
                src={chevronMobile.src}
                alt=""
                className="h-auto w-10 max-w-none md:w-22"
              />
            </picture>
          </span>
        </button>
      </h3>

      <Collapse open={open} id={id} className="duration-800">
        <div className="px-10 pb-12 pt-12 md:px-30 md:pb-40 md:pt-30">
          <p className="text-mute t-body">{lines(nomination.brief)}</p>
          <p className="mt-12 text-mute t-note md:mt-30 md:opacity-90">
            Как будем оценивать?
          </p>
          <p className="mt-5 text-mute t-small md:mt-10">
            {lines(nomination.criteria)}
          </p>
        </div>
      </Collapse>
    </li>
  );
}

/** The six nominations, each in a pane of its own; all start closed. */
export function Nominations({ className }: { className?: string }) {
  return (
    <Reveal
      as="ul"
      group
      stagger={0.08}
      y={32}
      className={cn("flex flex-col gap-12 md:gap-20", className)}
    >
      {NOMINATIONS.map((nomination) => (
        <Panel key={nomination.id} nomination={nomination} />
      ))}
    </Reveal>
  );
}
