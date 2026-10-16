import { ART } from "@/assets/art";
import glowTop from "@/assets/images/glow/m-hero-gradient-1.webp";
import glowPhone from "@/assets/images/glow/m-hero-gradient-2.webp";
import pageGlow from "@/assets/images/glow/page-glow.webp";
import { HeroStage } from "@/components/motion/HeroStage";
import { Stand } from "@/components/motion/Stand";
import { Niche } from "@/components/sections/Niche";
import { Arc } from "@/components/ui/Arc";
import { Blob } from "@/components/ui/Blob";
import { Disc } from "@/components/ui/Disc";
import { Picture } from "@/components/ui/Picture";
import { lines } from "@/lib/lines";

/**
 * First screen of the home page: the award plaque on a rock, in a lit niche
 * that runs up under the header. On a phone the copy follows below the niche;
 * on desktop it sits inside it, to the left of the plaque.
 */
export function Hero() {
  return (
    <HeroStage
      labelledBy="hero-title"
      className="relative pb-49 max-md:z-20 md:h-1375 md:pb-0"
    >
      {/*
       * Light behind the copy; on desktop it spreads on below the niche. On a
       * phone the mockup draws it over the next section instead: its dark lower
       * edge veils the top of the first card there, hence the z-index above.
       */}
      <div className="absolute inset-0">
        <div data-hero-light className="absolute inset-0">
          <Blob
            src={glowPhone}
            frame="-left-345 top-256 h-733 w-753.5 md:hidden"
            spin="rotate-[14.6deg]"
            box="h-595 w-623.5"
            bleed="inset-[-13.08%_-12.48%]"
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
        <div data-hero-light className="absolute inset-0 [--i:1] md:hidden">
          <Blob
            src={glowTop}
            frame="-left-60.75 -top-114.5 h-554.25 w-412.25"
            spin="-scale-y-100 rotate-[65.77deg]"
            box="h-223.75 w-507.25"
            bleed="inset-[-57.85%_-12.37%_-57.05%_-25.33%]"
          />
        </div>
      </div>

      <Niche className="h-347 md:h-1375">
        <div data-hero-light className="absolute inset-0">
          <Disc
            frame="-left-25.75 top-132.75 size-288.75 md:left-737.75 md:top-488.25 md:size-747.25"
            spin="-scale-y-100 rotate-[-135.2deg]"
            box="size-204.25 md:size-528.5"
            fade="none"
            sizes="(width < 48rem) 57vw, 28vw"
            preload
          />
        </div>
        <div
          data-hero-copy
          className="absolute left-40 top-68 h-300.5 w-344.75 md:left-739.5 md:top-220.75 md:h-1195 md:w-1370.75"
        >
          {/*
           * The mockup masks a strip off the edges of the render. The mask is
           * square to the page, not to the tilted picture: cut along the
           * picture, it slices the top corner of the plaque. Its bottom edge is
           * the floor the rock stands on (--foot).
           */}
          <Stand
            className="flex size-full items-center justify-center [--foot:calc(var(--u)*21.5)] [clip-path:inset(0_calc(var(--u)*21.75)_calc(var(--u)*21.5)_calc(var(--u)*13))] md:[--foot:calc(var(--u)*41)] md:[clip-path:inset(calc(var(--u)*77.25)_calc(var(--u)*89.5)_calc(var(--u)*41)_calc(var(--u)*89.5))]"
          >
            <div className="flex-none rotate-[1.23deg]">
              <Picture
                art={ART.plaque}
                sizes="(width < 48rem) 94vw, 70vw"
                quality={90}
                preload
                className="block h-293.25 w-338.5 max-w-none md:h-1166.5 md:w-1346.25"
              />
            </div>
          </Stand>
        </div>
        <div data-hero-light className="absolute inset-0 [--i:2]">
          <Arc
            frame="left-197 top-41.75 h-131 w-145 md:left-1418.75 md:top-168.75 md:h-325 md:w-372.5"
            spin="rotate-[-77.11deg] md:rotate-[-94.83deg]"
            box="h-124.5 w-106 md:h-348.75 md:w-296.75"
          />
        </div>
      </Niche>

      <div className="relative px-16 pt-373 md:px-120 md:pt-303">
        <h1 id="hero-title" className="font-medium">
          <span
            data-hero-copy
            className="absolute left-21 top-72 text-[calc(var(--u)*40)] leading-36 uppercase md:left-120 md:top-192 md:text-[calc(var(--u)*122)] md:leading-109"
          >
            {lines("Пре{м}ия")}
          </span>{" "}
          <span
            data-hero-copy
            className="[--i:1] block text-[calc(var(--u)*58)] leading-38 tracking-[-0.02em] whitespace-nowrap lowercase md:text-[calc(var(--u)*162)] md:leading-130 md:tracking-normal"
          >
            {lines("Зн{а}к\nмасте{р}ства")}
          </span>
        </h1>

        <div className="mt-30 flex flex-col gap-30 t-body md:mt-70 md:w-682 md:gap-50">
          <div className="flex flex-col gap-12 md:gap-30">
            <p
              data-hero-copy
              className="[--i:2] t-lead max-md:[text-shadow:0_0_20px_#08153b,0_0_10px_rgb(8_21_59/0.6),0_4px_19px_#08153b] md:[text-box:trim-both_cap_alphabetic]"
            >
              Признание,
              <br />
              заслуженное делом
            </p>
            <p data-hero-copy className="[--i:3] text-mute">
              Каждый день вы помогаете людям решать задачи, совершенствуете своё
              мастерство и развиваете собственное дело. Пришло время, чтобы
              о&nbsp;ваших достижениях узнали другие!
            </p>
          </div>
          <div className="flex flex-col gap-12 md:gap-30">
            <p data-hero-copy className="[--i:4]">
              {lines("«Знак мастерства» — первая|ежегодная^премия Авито Услуг.")}
            </p>
            <p data-hero-copy className="[--i:5] text-mute">
              Она объединяет профессионалов
              <br />
              из разных сфер услуг по всей России
              <br />
              и отмечает тех, кто делает
              <br />
              своё дело на совесть.
            </p>
          </div>
        </div>
      </div>
    </HeroStage>
  );
}
