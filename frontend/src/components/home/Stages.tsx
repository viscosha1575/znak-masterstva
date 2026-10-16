import { LineReveal } from "@/components/motion/LineReveal";
import { StageList } from "@/components/sections/StageCards";
import { Arc } from "@/components/ui/Arc";
import { Disc } from "@/components/ui/Disc";
import { STAGES } from "@/content/home";

export function Stages() {
  return (
    <section
      aria-labelledby="stages-title"
      className="relative z-10 mt-50 px-16 md:mt-160 md:px-120"
    >
      <Disc
        frame="left-211 -top-21 size-158.5 md:left-1165.25 md:top-299.25 md:size-548.25"
        spin="-scale-y-100 rotate-[-91.43deg] md:rotate-[92.64deg]"
        box="size-154.75 md:size-524.5"
      />
      <Arc
        frame="-left-56 top-909 h-146.5 w-147.25 md:hidden"
        spin="rotate-[133.39deg]"
      />
      <Arc
        frame="left-922 top-352 h-493 w-469.75 max-md:hidden"
        spin="rotate-[151.62deg]"
        box="h-383.75 w-326.75"
        dark
      />

      {/* The desktop mockup leaves the «е» plain. */}
      <LineReveal
        id="stages-title"
        className="relative t-h2 max-md:-mb-0.5 max-md:pt-0.5"
        text={{ mobile: "Эт{а}пы п[р]{е}мии", desktop: "Эт{а}пы п[р]емии" }}
      />

      <StageList stages={STAGES} className="mt-24 md:mt-70" />
    </section>
  );
}
