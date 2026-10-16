import { PrizeCarousel } from "@/components/home/PrizeCarousel";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { PrizeList } from "@/components/sections/Prizes";
import { Arc } from "@/components/ui/Arc";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/ui/Disc";

/** The prizes of the contest: a carousel on a phone, a grid on desktop. */
export function Prizes() {
  return (
    <section
      aria-labelledby="prizes-title"
      className="relative z-10 mt-40 md:mt-160 md:px-120"
    >
      <Disc
        frame="left-251.75 top-27.25 size-218.25 md:left-1349.25 md:top-18.5 md:size-746"
        spin="-scale-y-100 rotate-[139.47deg]"
        box="size-154.75 md:size-529"
      />
      <Arc
        frame="left-288.5 -top-4.75 h-131.25 w-140.25 md:left-1474.75 md:-top-91 md:h-449 md:w-479.75"
        spin="rotate-[-112.55deg]"
        box="h-112.25 w-95.5 md:h-383.75 md:w-326.75"
        dark
      />

      <LineReveal
        id="prizes-title"
        className="relative t-h2 max-md:px-16 max-md:-mb-0.5 max-md:pt-0.5"
        text={"Наг{р}ады\nпобедителям\nв номин{а}ции"}
      />

      <Reveal className="mt-24 md:hidden">
        <PrizeCarousel />
      </Reveal>
      <PrizeList className="mt-70 max-md:hidden" />

      <Reveal className="mt-24 flex justify-center max-md:px-16 md:mt-70">
        <Button href="/contest" className="max-md:w-full">
          Подробнее о номинации
        </Button>
      </Reveal>
    </section>
  );
}
