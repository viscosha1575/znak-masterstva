import { ART } from "@/assets/art";
import glowPhone from "@/assets/svg/m-prize-glow.svg";
import glow from "@/assets/svg/prize-glow.svg";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { Tilt } from "@/components/motion/Tilt";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/ui/Disc";
import { Picture } from "@/components/ui/Picture";
import { lines } from "@/lib/lines";

/** What everyone in the rating gets — the badge. */
export function RatingBadge() {
  return (
    <section
      aria-labelledby="badge-title"
      className="relative z-10 mt-50 px-16 md:mt-185 md:px-120"
    >
      {/* The desktop mockup masks this disc with a larger circle than the others. */}
      <Disc
        frame="left-240 top-97 size-158.5 md:left-1198.25 md:top-220.75 md:size-404"
        spin="-scale-y-100 rotate-[-91.43deg] md:rotate-[-43.41deg]"
        box="size-154.75 md:size-285.75"
        className="md:[--fade-from:22.7%] md:[--fade-to:68.29%]"
      />

      <LineReveal
        id="badge-title"
        className="relative t-h2 max-md:tracking-[0.01em] max-md:-mb-0.5 max-md:pt-0.5"
        text={"Что получ{а}т|исп{о}лнители\nвошедшие|в р{е}йтинг?"}
      />

      <Reveal className="mt-24 md:mx-auto md:mt-70 md:w-830">
        <Tilt
          as="article"
          className="glass h-201 overflow-clip rounded-card bg-night/5 [--glass-blur:1.66] md:h-522 md:[--glass-blur:5.8]"
        >
          <Blob
            src={glowPhone}
            frame="-left-90.75 top-94.5 h-187.75 w-194.25 md:hidden"
            bleed="inset-[-29.64%_-27.27%_-11.91%_-14.07%]"
          />
          <Blob
            src={glow}
            frame="-left-236 top-256 h-477 w-494 max-md:hidden"
            bleed="inset-[-43.56%_-40.71%_-25.83%_-27.51%]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-6 top-67 flex size-151 items-center justify-center md:left-387.25 md:top-117.25 md:size-455.25"
          >
            <div className="size-full flex-none md:size-422 md:rotate-[0.2deg]">
              <Picture
                art={ART.badge}
                sizes="(width < 48rem) 42vw, 22vw"
                quality={90}
                className="block size-full object-cover"
              />
            </div>
          </div>
          <Blob
            src={glowPhone}
            frame="-left-91.75 top-218.5 h-187.75 w-194.25 md:hidden"
            bleed="inset-[-29.64%_-27.27%_-11.91%_-14.07%]"
          />

          <h3 className="absolute right-20 top-20 text-right t-h3 md:left-40 md:right-auto md:top-40 md:text-left">
            {lines("Больше внимания\nк вашим услугам")}
          </h3>
          <p className="absolute right-20 top-78 text-right whitespace-nowrap text-mute t-note max-md:opacity-80 md:left-40 md:right-auto md:top-178 md:text-left">
            {lines(
              "Получите бейдж\n«Знак мастерства»\nв профиле, место\nв подборке со\nспециальным фильтром\nв своей категории\nи в подборках\nдля заказчиков.",
            )}
          </p>
        </Tilt>
      </Reveal>

      <Reveal className="mt-24 md:mt-70 md:flex md:justify-center">
        <Button href="/rating" className="max-md:w-full">
          Подробнее о рейтинге
        </Button>
      </Reveal>
    </section>
  );
}
