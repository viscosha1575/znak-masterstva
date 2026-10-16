import type { StaticImageData } from "next/image";
import { ART, type Art } from "@/assets/art";
import light from "@/assets/svg/light.svg";
import glowPhone1 from "@/assets/images/glow/m-track-glow-1.webp";
import glowPhone2 from "@/assets/images/glow/m-track-glow-2.webp";
import lightPhoneA from "@/assets/svg/m-track-light-a.svg";
import lightPhoneB from "@/assets/svg/m-track-light-b.svg";
import lightPhoneC from "@/assets/svg/m-track-light-c.svg";
import glow from "@/assets/images/glow/track-glow.webp";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";
import { Arc } from "@/components/ui/Arc";
import { Blob } from "@/components/ui/Blob";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/ui/Disc";
import { Picture } from "@/components/ui/Picture";
import { lines, type PerLayout } from "@/lib/lines";

type Track = {
  title: string;
  /** Break markers as in lib/lines.tsx; two versions where the mockups word it differently. */
  text: Array<string | PerLayout>;
  cta: string;
  href: string;
  art: Art;
  /** Position and size of the render in the open top of the card. */
  frame: string;
  disc: { frame: string; spin: string };
  /** The glow of the phone layout; the desktop cards share one. */
  glowPhone: {
    src: StaticImageData;
    frame: string;
    spin: string;
    box: string;
    bleed: string;
  };
  /** On a phone only the first card has the light in its corner. */
  lightPhone?: boolean;
};

const TRACKS: Track[] = [
  {
    title: "Рейтинг",
    text: [
      {
        mobile:
          "Автоматически сформируем рейтинг из 2,8 миллиона специалистов и компаний на платформе Авито Услуги и отберем более 35 тысяч участников. Они сформируют топ-100 исполнителей и компаний в каждой из 11 категорий услуг в 16 городах-миллионниках.",
        desktop:
          "Автоматически сформируем рейтинг из 2,8 миллиона\nспециалистов и компаний на платформе Авито Услуги\nи отберем более 35 тысяч.\nОни сформируют топ-100 исполнителей\nи компаний в каждой из 11 категорий услуг\nв 16 городах-миллионниках.",
      },
      "Все участники рейтинга получат специальный бейдж «Знак мастерства», который будет отображаться^в поисковой выдаче Авито Услуг и поможет выделиться среди других предложений.",
    ],
    cta: "О рейтинге",
    href: "/rating",
    art: ART.podium,
    frame:
      "left-22 top-23 h-176 w-283 md:left-15 md:top-62.25 md:h-492.5 md:w-800",
    disc: {
      frame:
        "-left-18 -top-18.75 size-226.5 md:-left-47 md:-top-48.5 md:size-561",
      spin: "-scale-y-100 rotate-[-135.2deg]",
    },
    glowPhone: {
      src: glowPhone1,
      frame: "-left-223 top-[calc(50%+var(--u)*214.29)] h-835.5 w-730.75",
      spin: "-scale-y-100 rotate-[-121.57deg]",
      box: "h-409.75 w-729",
      bleed: "inset-[-12.21%_-6.86%]",
    },
    lightPhone: true,
  },
  {
    title: "Конкурс",
    text: [
      "Выберите номинацию и расскажите свою историю. Победителей определим на основе показателей работы на Авито, оценки профессионального^жюри|и голосования пользователей.^Победители получат призы!",
    ],
    cta: "О конкурсе",
    href: "/contest",
    art: ART.trophy,
    frame:
      "left-22 top-13 h-184.5 w-274 md:left-15 md:top-62.25 md:h-492.5 md:w-800",
    disc: {
      frame: "left-138.5 top-13.25 size-207 md:left-337 md:top-40 md:size-561",
      spin: "-scale-y-100 rotate-[-63.95deg] md:rotate-[-135.2deg]",
    },
    glowPhone: {
      src: glowPhone2,
      frame: "-left-239 top-[calc(50%+var(--u)*122.34)] h-948.75 w-696.5",
      spin: "rotate-[-73.65deg]",
      box: "h-477 w-848.75",
      bleed: "inset-[-10.48%_-5.89%]",
    },
  },
];

/** The two ways to take part: the automatic rating and the contest. */
export function Tracks() {
  return (
    <section aria-label="Форматы участия" className="relative z-10 md:mt-160">
      {/* Phone: two arcs behind the cards, softened by the cards' glass. */}
      <Arc
        frame="left-212 top-96.75 h-137 w-126.5 md:hidden"
        spin="rotate-[18.7deg]"
      />
      <Arc
        frame="left-72 top-673 h-147.5 w-145.25 md:hidden"
        spin="-scale-y-100 rotate-[140.42deg]"
      />

      <Reveal
        group
        stagger={0.14}
        className="grid gap-24 px-16 md:grid-cols-2 md:gap-20 md:px-120"
      >
        {TRACKS.map((track) => (
          <Tilt
            as="article"
            key={track.href}
            data-reveal-item=""
            className="glass flex flex-col overflow-clip rounded-(--pane-r) bg-violet/5 px-20 pb-24 pt-206 [--glass-blur:1.66] [--pane-r:var(--radius-card)] md:h-1196 md:px-15 md:pb-15 md:pt-601 md:[--glass-blur:11.6] md:[--pane-r:calc(var(--u)*28)]"
          >
            <Blob
              src={track.glowPhone.src}
              frame={`${track.glowPhone.frame} -translate-y-1/2 md:hidden`}
              spin={track.glowPhone.spin}
              box={track.glowPhone.box}
              bleed={track.glowPhone.bleed}
            />
            <Blob
              src={glow}
              frame="-left-373.5 top-290.75 h-1767.75 w-1556.25 max-md:hidden"
              spin="-scale-y-100 rotate-[-122.23deg]"
              box="h-867 w-1543"
              bleed="inset-[-10.84%_-6.09%]"
            />
            {track.lightPhone && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 md:hidden"
              >
                <Blob
                  src={lightPhoneA}
                  frame="left-136 -top-10 h-197.5 w-204.25"
                  bleed="inset-[-12.21%_-11.81%]"
                />
                <Blob
                  src={lightPhoneB}
                  frame="left-153.5 -top-5 h-188.75 w-185.25"
                  bleed="inset-[-12.78%_-13.02%]"
                />
                <Blob
                  src={lightPhoneC}
                  frame="left-178.5 -top-10 h-159.25 w-163.5"
                  bleed="inset-[-11.62%_-11.31%]"
                />
              </div>
            )}
            <Blob
              src={light}
              frame="left-287 -top-36 h-334 w-614 max-md:hidden"
              bleed="inset-[-18.06%_-8.55%_-18.06%_-9.83%]"
            />

            {/* The object stands on a rock in the open top of the card; the phone mockup fades its disc, the desktop one does not. */}
            <Disc
              frame={track.disc.frame}
              spin={track.disc.spin}
              box="size-160.25 md:size-396.75"
              fade="phone"
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute ${track.frame}`}
            >
              <Picture
                art={track.art}
                sizes="(width < 48rem) 79vw, 42vw"
                className="block size-full max-w-none"
              />
            </div>

            <div className="relative">
              <h2 className="t-h3">{track.title}</h2>
              <div className="mt-12 flex flex-col gap-8 text-mute t-body-sm md:mt-30 md:gap-20">
                {track.text.map((paragraph, i) => (
                  <p key={i}>{lines(paragraph)}</p>
                ))}
              </div>
            </div>

            <Button
              href={track.href}
              variant="outline"
              className="relative mt-20 w-full md:mt-auto"
            >
              {track.cta}
            </Button>
          </Tilt>
        ))}
      </Reveal>
    </section>
  );
}
