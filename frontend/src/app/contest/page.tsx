import type { Metadata } from "next";
import { ART } from "@/assets/art";
import contestGlow from "@/assets/images/glow/m-contest-gradient.webp";
import { Nominations } from "@/components/contest/Nominations";
import { Streak } from "@/components/home/Streak";
import { Page } from "@/components/layout/Page";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { InnerHero } from "@/components/sections/InnerHero";
import { PrizeList } from "@/components/sections/Prizes";
import { StageList, type Stage } from "@/components/sections/StageCards";
import { Arc } from "@/components/ui/Arc";
import { Button } from "@/components/ui/Button";
import { Disc } from "@/components/ui/Disc";
import { lines } from "@/lib/lines";

export const metadata: Metadata = {
  title: "О конкурсе",
  description:
    "Конкурс премии «Знак мастерства»: номинации, критерии оценки жюри, награды победителям и этапы отбора.",
  alternates: { canonical: "/contest" },
};

const STAGES: Stage[] = [
  {
    title: "Формирование\nрейтинга",
    date: "12 октября – 7 ноября",
    datePhoneOnly: true,
    text: {
      mobile: "Оценим показатели работы исполнителей на Авито Услугах.",
      desktop:
        "Автоматически оценим показатели работы исполнителей на Авито Услугах.",
    },
    light: "lilac",
    className: "md:h-402",
  },
  {
    title: "Отбор финалистов",
    date: "8–10 ноября",
    text: "Жюри отбирают финалистов|из поданных заявок с релевантным рейтингом. Оценка жюри и сам рейтинг работы весят^по 40% каждый в итоговом результате.",
    light: "lilac",
    className: "md:h-402",
  },
  {
    title: "Народное|голосование",
    date: "11–20 ноября",
    text: "Пользователи выбирают лучшие истории – народное голосование дает 20% финальной оценки участника.",
    light: "lilac",
    lightDesktop: "low",
    className: "md:h-360",
  },
  {
    title: "Результаты",
    date: "11 декабря",
    text: "Объявляем лучших исполнителей Авито^в рамках шести номинаций премии.",
    light: "lilac",
    lightDesktop: "low",
    className: "h-146 md:h-360",
  },
  {
    title: "Награждение",
    date: "11 декабря",
    text: "Поздравляем победителей\nна церемонии в Москве.",
    light: "lilac",
    lightDesktop: "low",
    className: "h-146 md:col-span-2 md:mx-auto md:h-328 md:w-830",
  },
];

export default function ContestPage() {
  return (
    <Page>
      <InnerHero
        labelledBy="contest-title"
        className="relative px-16 pb-50 pt-346 md:h-1260 md:px-120 md:pb-0 md:pt-286"
        niche="h-316 md:h-1260"
        art={ART.trophy}
        frame="left-13 top-96 h-221 w-331 md:left-850 md:top-566 md:h-698 md:w-1121"
        disc={{
          frame:
            "left-94.5 top-56.25 size-259.75 md:left-1040.75 md:top-238.75 md:size-968.25",
          spin: "-scale-y-100 rotate-[-63.95deg] md:rotate-[-135.2deg]",
          box: "size-194.25 md:size-684.75",
        }}
        arcPhone={{
          frame: "left-87 top-174 h-147.5 w-145.25",
          spin: "-scale-y-100 rotate-[140.42deg]",
        }}
        glowPhone={{
          src: contestGlow,
          frame: "-left-578.5 top-320 h-661 w-1225.5",
          bleed: "inset-[-8.85%_-4.77%]",
        }}
      >
        <LineReveal
          as="h1"
          when="load"
          id="contest-title"
          text="О конку{р}се"
          className="relative t-h2 max-md:leading-37"
        />
        <p
          data-hero-copy
          className="[--i:0] relative mt-24 t-note md:mt-70 md:w-682 md:opacity-90"
        >
          {lines(
            "Расскажите о своём деле и покажите,^чего вам|удалось достичь на Авито Услугах.",
          )}
        </p>
        <p
          data-hero-copy
          className="[--i:1] relative mt-24 text-mute t-body md:mt-30 md:w-682"
        >
          {lines(
            "Выберите до двух номинаций\nи расскажите о своих достижениях.\nУ каждой номинации свои критерии\nоценки. Победителей определим\nна основе показателей работы на Авито,\nоценки профессионального жюри\nи голосования пользователей.",
          )}
        </p>
        <p
          data-hero-copy
          className="[--i:2] relative mt-12 text-mute t-body md:mt-20 md:w-682"
        >
          {lines({
            mobile:
              "Лучшие исполнители получат признание от таких же профессионалов, призы\nот Авито и награду «Знак мастерства».",
            desktop:
              "Лучшие исполнители получат\nпризнание от таких же\nпрофессионалов, призы от Авито\nи награду «Знак мастерства».",
          })}
        </p>
        <div
          data-hero-copy
          className="[--i:3] relative mt-24 md:mt-40 md:w-682"
        >
          <Button href="/apply" variant="outline" className="w-full">
            Подать заявку
          </Button>
        </div>
      </InnerHero>

      <section
        aria-labelledby="nominations-title"
        className="relative z-10 px-16 md:mt-164 md:px-0"
      >
        <LineReveal
          id="nominations-title"
          className="t-h2 max-md:leading-37 md:text-center"
          text="Номин{а}ции"
        />
        <Reveal
          as="p"
          className="mt-24 t-body md:mx-auto md:mt-40 md:w-1148 md:text-center"
        >
          {lines({
            mobile:
              "Участники премии смогут выбрать\nдо двух номинаций — каждая посвящена отдельному направлению Авито Услуг.",
            desktop:
              "Участники премии смогут выбрать две номинации —\nкаждая посвящена отдельному направлению Авито Услуг.",
          })}
        </Reveal>

        <Nominations className="mt-24 md:mx-auto md:mt-70 md:w-1152" />
      </section>

      <section
        aria-labelledby="contest-prizes-title"
        className="relative z-10 mt-50 px-16 md:mt-160 md:px-120"
      >
        {/* Anchored here rather than to the page, so it stays behind the prizes however many nominations are open. */}
        <Streak
          frame="-left-280.5 top-774 -z-10 h-1608 w-1213 md:-left-89.5 md:top-117.5 md:h-4304.75 md:w-3857.5"
          spin="-scale-y-100 rotate-[119.35deg] md:rotate-[128.74deg]"
          box="h-518 w-1553.5 md:h-1452 md:w-4354"
          mask={{ left: 404.46, top: 645.5, right: 2009.46 }}
        />

        {/* The desktop mockup leaves the «о» plain. */}
        <LineReveal
          id="contest-prizes-title"
          className="t-h2 max-md:leading-37"
          text={{
            mobile: "Наг{р}ады\nп{о}бедителям",
            desktop: "Наг{р}ады\nпобедителям",
          }}
        />

        <PrizeList className="mt-24 md:mt-70" />
      </section>

      <section
        aria-labelledby="contest-stages-title"
        className="relative z-10 mt-50 px-16 pb-24 md:mt-160 md:px-120 md:pb-90"
      >
        <Disc
          frame="left-212.75 -top-55 size-218.25 md:left-1416.25 md:-top-93 md:size-647.75"
          spin="-scale-y-100 rotate-[139.47deg]"
          box="size-154.75 md:size-459.5"
        />
        <Arc
          frame="left-249.5 -top-87 h-131.25 w-140.25 md:left-1525.25 md:-top-188 md:h-389.75 md:w-416.5"
          spin="rotate-[-112.55deg]"
          box="h-112.25 w-95.5 md:h-333.25 md:w-283.75"
          dark
        />
        <Disc
          frame="-left-73.5 top-636.25 size-166.25 md:hidden"
          spin="-scale-y-100 rotate-[-85.53deg]"
          box="size-154.75"
        />

        <LineReveal
          id="contest-stages-title"
          className="relative t-h2 max-md:leading-38 max-md:-mb-0.5 max-md:pt-0.5"
          text="Как п[р]ох{о}дит|отбо{р}"
        />

        <StageList stages={STAGES} className="mt-24 md:mt-70" />

        <Reveal className="mt-24 flex justify-center md:mt-70">
          <Magnetic className="max-md:w-full">
            <Button href="/apply" className="max-md:w-full">
              Подать заявку
            </Button>
          </Magnetic>
        </Reveal>
      </section>
    </Page>
  );
}
