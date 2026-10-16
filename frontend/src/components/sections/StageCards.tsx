import type { StaticImageData } from "next/image";
import type { ElementType, ReactNode } from "react";
import lightDesktop from "@/assets/svg/light.svg";
import light from "@/assets/svg/m-light.svg";
import lightBright from "@/assets/svg/m-light-bright.svg";
import lightDark from "@/assets/svg/m-light-dark.svg";
import lightDim from "@/assets/svg/m-light-dim.svg";
import lightLilac from "@/assets/svg/m-light-lilac.svg";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";
import { Blob } from "@/components/ui/Blob";
import { cn } from "@/lib/cn";
import { lines, type PerLayout } from "@/lib/lines";

export type PhoneLight = "left" | "plain" | "dim" | "dark" | "lilac" | "bright";

/**
 * The light in the corner of a card. The phone mockup draws it in several
 * shades and places it a little differently from block to block.
 */
const PHONE_LIGHTS: Record<
  PhoneLight,
  { src: StaticImageData; frame: string; spin?: string }
> = {
  /** Lit from the left: the first stage on the home page. */
  left: {
    src: light,
    frame: "-left-21 -top-23 h-197.5 w-206",
    spin: "-scale-y-100 rotate-180",
  },
  /** The rating criteria. */
  plain: { src: light, frame: "left-143 -top-23 h-197.5 w-206" },
  dim: { src: lightDim, frame: "left-131 -top-9 h-197.5 w-206" },
  dark: { src: lightDark, frame: "left-140 -top-16 h-197.5 w-206" },
  lilac: { src: lightLilac, frame: "left-140 -top-16 h-197.5 w-206" },
  bright: { src: lightBright, frame: "left-141 -top-19 h-197.5 w-206" },
};

/** The desktop mockup has one light, at two heights. */
const DESKTOP_LIGHTS = {
  high: "left-267 -top-42 h-334 w-614",
  low: "left-287 -top-36 h-334 w-614",
};

type CardProps = {
  as?: ElementType;
  light: PhoneLight;
  lightDesktop?: keyof typeof DESKTOP_LIGHTS;
  className?: string;
  children: ReactNode;
};

/** A frosted card with a light in its corner. */
export function Card({
  as: Tag = "div",
  light: name,
  lightDesktop: desktop = "high",
  className,
  children,
}: CardProps) {
  const { src, frame, spin } = PHONE_LIGHTS[name];

  return (
    <Tilt
      as={Tag}
      data-reveal-item=""
      className={cn(
        "glass overflow-clip rounded-card bg-night/5 p-20 [--glass-blur:1.66] md:p-30 md:[--glass-blur:5.8]",
        className,
      )}
    >
      <Blob
        src={src}
        frame={cn(frame, "md:hidden")}
        spin={spin}
        box={spin && "h-197.5 w-206"}
        bleed="inset-[-12.21%_-10.8%_-12.21%_-11.71%]"
      />
      <Blob
        src={lightDesktop}
        frame={cn(DESKTOP_LIGHTS[desktop], "max-md:hidden")}
        bleed="inset-[-18.06%_-8.55%_-18.06%_-9.83%]"
      />
      {children}
    </Tilt>
  );
}

export type Stage = {
  /** Break markers as in lib/lines.tsx. */
  title: string | PerLayout;
  date?: string;
  /** The date is in the phone mockup only. */
  datePhoneOnly?: boolean;
  text: string | PerLayout;
  light: PhoneLight;
  lightDesktop?: keyof typeof DESKTOP_LIGHTS;
  /**
   * Height of the card where the mockup fixes it, and its place in the grid.
   * On a phone most cards are simply as tall as their copy; on desktop the
   * mockup gives every card a height of its own.
   */
  className?: string;
};

type StageListProps = {
  stages: Stage[];
  className?: string;
  /** Width of the text column on a phone; it decides where lines wrap. */
  textClassName?: string;
};

/** A timeline: dated steps, one frosted card each — a column on a phone, two on desktop. */
export function StageList({
  stages,
  className,
  textClassName = "w-276",
}: StageListProps) {
  return (
    <Reveal
      as="ol"
      group
      stagger={0.14}
      className={cn(
        "grid gap-16 md:grid-cols-2 md:items-start md:gap-20",
        className,
      )}
    >
      {stages.map((stage, index) => (
        <Card
          as="li"
          key={index}
          light={stage.light}
          lightDesktop={stage.lightDesktop}
          className={stage.className}
        >
          <h3 className="relative t-h3">{lines(stage.title)}</h3>
          {stage.date && (
            <p
              className={cn(
                "relative mt-12 text-mute t-date md:mt-30",
                stage.datePhoneOnly && "md:hidden",
              )}
            >
              {stage.date}
            </p>
          )}
          <p
            className={cn(
              "relative mt-12 t-body md:mt-50 md:w-770",
              textClassName,
            )}
          >
            {lines(stage.text)}
          </p>
        </Card>
      ))}
    </Reveal>
  );
}
