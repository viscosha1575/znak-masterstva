import type { Metadata } from "next";
import { ART } from "@/assets/art";
import ratingGlow from "@/assets/images/glow/m-rating-gradient.webp";
import { Streak } from "@/components/home/Streak";
import { Page } from "@/components/layout/Page";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { InnerHero } from "@/components/sections/InnerHero";
import { Card, StageList, type Stage } from "@/components/sections/StageCards";
import { Arc } from "@/components/ui/Arc";
import { Disc } from "@/components/ui/Disc";
import { cn } from "@/lib/cn";
import { lines } from "@/lib/lines";

export const metadata: Metadata = {
  title: "О рейтинге",
  description:
    "Как формируется рейтинг премии «Знак мастерства»: критерии и этапы подсчёта.",
  alternates: { canonical: "/rating" },
};

/*
 * The two mockups list the rating criteria in a different order and word a few
 * of them differently, so each layout has its own list. "\n" breaks the line.
 *
 * The client took out two of the mockups' eight: the use of Avito's own tools
 * and paid promotion (7 and 8 on desktop, 6 and 7 on the phone). Promotion
 * now only breaks ties — the note under the cards.
 */
const PHONE_CRITERIA: Array<[title: string, text: string]> = [
  ["Подтверждение\nданных в профиле", "обязательное условие участия"],
  ["Уровень сервиса", "учитываем качество\nвзаимодействия с заказчиками"],
  ["Отзывы", "оцениваем количество\nполученных отзывов"],
  ["Рейтинг\nна Авито Услугах", "учитываем среднюю оценку\nисполнителя"],
  [
    "Срок размещения\nобъявлений",
    "оцениваем продолжительность\nактивности на платформе",
  ],
  [
    "Количество\nконтактов",
    "учитываем число обращений\nпотенциальных клиентов",
  ],
];

/** Desktop: two columns, and every row of cards has a height of its own. */
const DESKTOP_CRITERIA: Array<[title: string, text: string, height: string]> = [
  ["Подтверждение\nданных в профиле", "обязательное условие участия", "h-280"],
  ["Рейтинг\nна Авито Услугах", "средняя оценка исполнителя", "h-280"],
  ["Отзывы", "оцениваем количество\nполученных отзывов", "h-322"],
  [
    "Уровень сервиса",
    "учитываем качество\nвзаимодействия с заказчиками",
    "h-322",
  ],
  [
    "Срок размещения\nобъявлений",
    "оцениваем продолжительность\nактивности на платформе",
    "h-364",
  ],
  [
    "Количество\nконтактов",
    "учитываем число обращений\nпотенциальных клиентов",
    "h-364",
  ],
];

const STAGES: Stage[] = [
  {
    title: "Отбор|исполнителей",
    date: "12 октября – 7 ноября",
    text: {
      mobile:
        "Улучшайте показатели своего\nпрофиля на Авито Услугах\nи оставайтесь активными — так у\nвас будет больше шансов попасть\nв рейтинг.",
      desktop:
        "Улучшайте показатели своего профиля\nна Авито Услугах и оставайтесь\nактивными — так больше шансов\nпопасть в рейтинг.",
    },
    light: "bright",
    className: "md:h-412",
  },
  {
    title: "Результаты",
    date: "11 декабря",
    text: "Отметим топ-100 частных специалистов^и компаний, вошедших в рейтинг, специальным бейджем «Знак мастерства» на Авито Услугах.",
    light: "bright",
    className: "md:h-412",
  },
];

export default function RatingPage() {
  return (
    <Page>
      <Streak
        frame="-left-270.5 top-1748 h-1608 w-1213 md:-left-15.5 md:top-1293.5 md:h-4304.75 md:w-3857.5"
        spin="-scale-y-100 rotate-[119.35deg] md:rotate-[128.74deg]"
        box="h-518 w-1553.5 md:h-1452 md:w-4354"
        mask={{ left: 327.46, top: 820.5, right: 1935.46 }}
      />

      <InnerHero
        labelledBy="rating-title"
        className="relative px-16 pb-50 pt-345 md:h-943 md:px-120 md:pb-0 md:pt-302"
        niche="h-316 md:h-943"
        art={ART.podium}
        frame="left-21 top-122 h-194 w-312 md:left-844 md:top-322 md:h-621 md:w-998"
        disc={{
          frame:
            "-left-4.75 top-53.75 size-226.5 md:left-796.75 md:top-61.75 md:size-754.5",
          spin: "-scale-y-100 rotate-[-135.2deg]",
          box: "size-160.25 md:size-533.5",
        }}
        glowPhone={{
          src: ratingGlow,
          frame: "-left-312 top-341 h-446.75 w-828.25",
          bleed: "inset-[-13.1%_-7.06%]",
        }}
      >
        <LineReveal
          as="h1"
          when="load"
          id="rating-title"
          text="О [р]ейтинге"
          className="relative t-h2 max-md:-mb-0.5 max-md:pt-0.5"
        />
        <p
          data-hero-copy
          className="[--i:0] relative mt-24 t-note md:mt-70 md:w-682 md:opacity-90"
        >
          Рейтинг покажет топ специалистов платформы!
        </p>
        <p
          data-hero-copy
          className="[--i:1] relative mt-24 text-mute t-body md:mt-30 md:w-682"
        >
          {lines(
            "Ничего дополнительно делать^не нужно: все исполнители Авито Услуг\nс подтвержденными данными автоматически участвуют в рейтинге исполнителей.",
          )}
        </p>
      </InnerHero>

      <section
        aria-labelledby="criteria-title"
        className="relative z-10 px-16 md:mt-160 md:px-120"
      >
        <LineReveal
          id="criteria-title"
          className="t-h2 max-md:leading-38 md:leading-115 max-md:-mb-0.5 max-md:pt-0.5"
          text={"Как|ф{о}[р]ми[р]уется\n{р}ейтинг?"}
        />

        <Reveal as="p" className="mt-24 t-note md:mt-40 md:opacity-90">
          {lines({
            mobile:
              "Автоматически сформируем рейтинг\nиз 2,8 миллиона специалистов и компаний\nна платформе Авито Услуги и отберем\nболее 35 тысяч, которые войдут в топ-100\nв каждой из 11 категорий услуг\nв 16 городах-миллионниках.",
            desktop:
              "Автоматически сформируем рейтинг из 2,8 миллиона специалистов\nи компаний на платформе Авито Услуги и отберем более 35 тысяч, которые войдут\nв топ-100 в каждой из 11 категорий услуг в 16 городах-миллионниках.",
          })}
        </Reveal>
        <Reveal as="p" className="mt-12 text-mute t-body md:mt-70">
          {lines(
            "Отбор проходит автоматически на основе показателей работы^исполнителей|за 2026 год. Каждый критерий имеет\nсвой вес в итоговой оценке:",
          )}
        </Reveal>

        {/* Phone: one column, in the phone mockup's order. */}
        <Reveal
          as="ol"
          group
          stagger={0.07}
          y={32}
          className="mt-24 grid gap-12 md:hidden"
        >
          {PHONE_CRITERIA.map(([title, text], index) => (
            <Card as="li" key={title} light="plain">
              <h3 className="relative whitespace-pre-line t-h3">{title}</h3>
              <p className="relative mt-12 whitespace-pre-line t-body">
                {text}
              </p>
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-8 text-lilac opacity-25 t-figure",
                  index === 0 ? "right-16" : "right-5",
                )}
              >
                {index + 1}
              </span>
            </Card>
          ))}
        </Reveal>

        {/* Desktop: two columns, in the desktop mockup's order. */}
        <Reveal
          as="ol"
          group
          stagger={0.07}
          y={32}
          className="mt-40 grid grid-cols-2 gap-20 max-md:hidden"
        >
          {DESKTOP_CRITERIA.map(([title, text, height], index) => (
            <Card
              as="li"
              key={title}
              light="plain"
              className={height}
            >
              <h3 className="relative whitespace-pre-line t-h3">{title}</h3>
              <p className="relative mt-50 whitespace-pre-line t-body">
                {text}
              </p>
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-30 text-lilac opacity-25 t-figure",
                  index === 0 ? "right-49" : "right-20",
                )}
              >
                {index + 1}
              </span>
            </Card>
          ))}
        </Reveal>

        <Reveal as="p" className="mt-24 text-mute t-body md:mt-40">
          При равенстве итоговых баллов места в&nbsp;рейтинге определяются
          <br className="max-md:hidden" /> с учётом количества используемых{" "}
          <b className="font-bold text-white">
            профессиональных инструментов продвижения.
          </b>
        </Reveal>
      </section>

      <section
        aria-labelledby="rating-stages-title"
        className="relative z-10 mt-50 px-16 pb-24 md:mt-160 md:px-120 md:pb-90"
      >
        <Disc
          frame="left-207.75 top-9 size-218.25 md:left-1328.25 md:-top-58 md:size-647.75"
          spin="-scale-y-100 rotate-[139.47deg]"
          box="size-154.75 md:size-459.5"
        />
        <Arc
          frame="left-244.5 -top-23 h-131.25 w-140.25 md:left-1437.25 md:-top-153 md:h-389.75 md:w-416.5"
          spin="rotate-[-112.55deg]"
          box="h-112.25 w-95.5 md:h-333.25 md:w-283.75"
          dark
        />
        <Disc
          frame="-left-58.25 top-484.25 size-199.25 md:-left-123.5 md:top-556.5 md:size-378.25"
          spin="-scale-y-100 rotate-[-159.41deg]"
          box="size-154.75 md:size-293.75"
        />

        <LineReveal
          id="rating-stages-title"
          className="relative t-h2 max-md:leading-38 md:leading-115 max-md:-mb-0.5 max-md:pt-0.5"
          text={"Этапы|подсч{е}та\n{р}ейтинга"}
        />

        <StageList
          stages={STAGES}
          className="mt-24 md:mt-70"
          textClassName="w-270"
        />
      </section>
    </Page>
  );
}
