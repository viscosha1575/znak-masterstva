import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import type { Art } from "@/assets/art";
import pageGlow from "@/assets/images/glow/page-glow.webp";
import { HeroStage } from "@/components/motion/HeroStage";
import { Stand } from "@/components/motion/Stand";
import { Niche } from "@/components/sections/Niche";
import { Arc } from "@/components/ui/Arc";
import { Blob } from "@/components/ui/Blob";
import { Disc } from "@/components/ui/Disc";
import { Picture } from "@/components/ui/Picture";
import { cn } from "@/lib/cn";

type InnerHeroProps = {
  labelledBy: string;
  className?: string;
  /** Height of the lit niche the object stands in. */
  niche: string;
  art: Art;
  /** Position and size of the render; its foot stands on the niche's bottom edge. */
  frame: string;
  disc: { frame: string; spin: string; box: string };
  /** An arc behind the object, which the phone mockup of one page has. */
  arcPhone?: { frame: string; spin: string };
  /** The glow that spreads behind the copy on a phone; the desktop pages share one. */
  glowPhone: { src: StaticImageData; frame: string; bleed: string };
  children: ReactNode;
};

/**
 * First screen of an inner page: a 3D object on a rock, in a lit niche that
 * runs up under the header. On a phone the copy follows below the niche; on
 * desktop it sits inside it, to the left of the object.
 */
export function InnerHero({
  labelledBy,
  className,
  niche,
  art,
  frame,
  disc,
  arcPhone,
  glowPhone,
  children,
}: InnerHeroProps) {
  return (
    <HeroStage labelledBy={labelledBy} className={className}>
      <div data-hero-light className="absolute inset-0">
        <Blob
          src={glowPhone.src}
          frame={cn(glowPhone.frame, "md:hidden")}
          bleed={glowPhone.bleed}
          preload="mobile"
        />
        <Blob
          src={pageGlow}
          frame="-left-510 top-417 h-2277.75 w-2349 max-md:hidden"
          spin="rotate-[11.75deg]"
          box="h-1910.25 w-2002"
          bleed="inset-[-5.24%_-5%_-5.24%_-7.33%]"
          preload="desktop"
        />
      </div>

      <Niche className={niche}>
        <div data-hero-light className="absolute inset-0 [--i:1]">
          {arcPhone && (
            <Arc frame={cn(arcPhone.frame, "md:hidden")} spin={arcPhone.spin} />
          )}
          <Disc
            frame={disc.frame}
            spin={disc.spin}
            box={disc.box}
            sizes="(width < 48rem) 54vw, 36vw"
            preload
          />
        </div>
        <div data-hero-copy className={cn("absolute", frame)}>
          <Stand className="size-full">
            <Picture
              art={art}
              sizes="(width < 48rem) 92vw, 58vw"
              quality={90}
              preload
              className="block size-full max-w-none"
            />
          </Stand>
        </div>
      </Niche>

      {children}
    </HeroStage>
  );
}
