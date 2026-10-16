import { ART, type Art } from "@/assets/art";
import glowPhone from "@/assets/svg/m-prize-glow.svg";
import glow from "@/assets/svg/prize-glow.svg";
import { Reveal } from "@/components/motion/Reveal";
import { Tilt } from "@/components/motion/Tilt";
import { Blob } from "@/components/ui/Blob";
import { Picture } from "@/components/ui/Picture";
import { cn } from "@/lib/cn";

/** Where a render sits in the card. */
type Placement = { frame: string; spin?: string; box?: string };

type Prize = {
  id: string;
  /**
   * "\n" breaks the line. The phone list names the statuette in full; the
   * carousel and the desktop grid do not.
   */
  title: string | { short: string; phoneList: string };
  /** The carousel of the phone layout, the list under it, the desktop grid. */
  text: { carousel: string; list: string; desktop: string };
  /** On a phone the copy of every second card is on the right. */
  phoneSide: "left" | "right";
  art: Art;
  /** In the 308-wide card of the carousel. */
  carousel: Placement;
  /** In the list card: 328 wide on a phone, 830 on desktop. */
  list: Placement;
  /** On desktop the render keeps its proportions; elsewhere it is stretched to its box. */
  contain?: boolean;
  /** The violet glow in a corner of the phone card; desktop cards all have one. */
  glowPhone?: "bottom-left" | "top-right";
};

export const PRIZES: Prize[] = [
  {
    id: "statuette",
    title: {
      short: "Знак\nмастерства",
      phoneList: "Статуэтка\n«Знак\nмастерства»",
    },
    text: {
      carousel: "Статуэтка\nза исключительное\nкачество.",
      list: "Статуэтка\nза исключительное\nкачество.",
      desktop: "Статуэтка\nза исключительное\nкачество.",
    },
    phoneSide: "left",
    art: ART.statuette,
    carousel: { frame: "left-63.75 top-26 h-181 w-260" },
    list: {
      frame:
        "left-69.25 top-15 h-221 w-301.25 md:left-234 md:top-64.25 md:h-447.75 md:w-685",
      spin: "rotate-[-8.77deg] md:rotate-0",
      box: "h-181 w-277",
    },
    contain: true,
    glowPhone: "bottom-left",
  },
  {
    id: "ceremony",
    title: "Церемония\nнаграждения",
    text: {
      carousel:
        "Поездка в Москву,\nобмен опытом с другими\nисполнителями, интервью\nжурналистам и вечеринка.",
      list: "Поездка в Москву,\nобмен опытом с другими\nисполнителями, интервью\nдля журналистов\nи вечеринка.",
      desktop:
        "Поездка в Москву,\nобмен опытом с другими\nисполнителями, интервью\nжурналистам\nи вечеринка.",
    },
    phoneSide: "right",
    art: ART.suitcase,
    carousel: { frame: "-left-84.5 top-15 h-193 w-254.5" },
    list: {
      frame:
        "-left-90 top-15 h-193 w-271 md:left-234 md:top-64.25 md:h-447.75 md:w-685",
    },
    contain: true,
    glowPhone: "top-right",
  },
  {
    id: "tour",
    title: "Экскурсия\nпо офису",
    text: {
      carousel:
        "Покажем лучшие уголки\nмосковского офиса\nАвито — места,\nгде творится магия,\nа ваши объявления\nнаходят своих клиентов.",
      list: "Покажем лучшие уголки\nмосковского офиса\nАвито — места,\nгде творится магия,\nа ваши объявления\nнаходят своих клиентов.",
      desktop:
        "Покажем лучшие уголки\nмосковского офиса\nАвито — места, где\nтворится магия, а ваши\nобъявления находят\nсвоих клиентов.",
    },
    phoneSide: "left",
    art: ART.pass,
    carousel: {
      frame: "left-109 top-17.5 h-170.75 w-246",
      spin: "rotate-[-1.7deg]",
      box: "h-163.75 w-241.25",
    },
    list: {
      frame:
        "left-105.5 top-12.25 h-181.5 w-262 md:left-234 md:top-64.25 md:h-447.75 md:w-685",
      spin: "rotate-[-1.7deg] md:rotate-0",
      box: "h-174 w-257",
    },
    contain: true,
  },
  {
    id: "money",
    title: "100 000₽",
    text: {
      carousel: "Денежный приз\nна развитие\nсвоего дела.",
      list: "Денежный приз\nна развитие\nсвоего дела.",
      desktop: "Денежный приз на развитие\nсвоего дела.",
    },
    phoneSide: "right",
    art: ART.money,
    carousel: { frame: "left-6 top-72 h-108 w-193" },
    list: {
      frame:
        "left-7 top-68 h-112 w-214 md:left-229 md:top-185 md:h-307 md:w-587",
    },
    glowPhone: "bottom-left",
  },
];

type PrizeCardProps = {
  prize: Prize;
  /** `carousel` is the phone carousel's card; `list` serves the phone list and the desktop grid. */
  variant: "carousel" | "list";
  className?: string;
};

/** A prize: a glass card with the prize standing on a rock. */
export function PrizeCard({ prize, variant, className }: PrizeCardProps) {
  const { frame, spin, box } = prize[variant];
  const list = variant === "list";
  const short =
    typeof prize.title === "string" ? prize.title : prize.title.short;
  const phoneTitle =
    typeof prize.title === "string" || !list ? short : prize.title.phoneList;

  return (
    <Tilt
      as="article"
      className={cn(
        "glass h-180 overflow-clip rounded-card bg-night/5 [--glass-blur:1.66] md:[--glass-blur:5.8]",
        list && "md:h-450",
        className,
      )}
    >
      {prize.glowPhone === "bottom-left" && (
        <Blob
          src={glowPhone}
          frame="-left-90.75 top-71.5 h-187.75 w-194.25 md:hidden"
          bleed="inset-[-29.64%_-27.27%_-11.91%_-14.07%]"
        />
      )}
      {prize.glowPhone === "top-right" && (
        <Blob
          src={glowPhone}
          frame="left-220.25 -top-76.5 h-187.75 w-194.25 md:hidden"
          spin="rotate-180"
          box="h-187.75 w-194.25"
          bleed="inset-[-29.64%_-27.27%_-11.91%_-14.07%]"
        />
      )}
      {list && (
        <Blob
          src={glow}
          frame="-left-246 top-224 h-477 w-494 max-md:hidden"
          bleed="inset-[-43.56%_-40.71%_-25.83%_-27.51%]"
        />
      )}

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute flex items-center justify-center",
          frame,
        )}
      >
        <div
          className={cn(
            "flex-none",
            spin,
            !box && "size-full",
            list && "md:size-full",
          )}
        >
          <Picture
            art={prize.art}
            sizes={list ? "(width < 48rem) 76vw, 36vw" : "76vw"}
            className={cn(
              "block max-w-none",
              box ?? "size-full",
              list && "md:size-full",
              list && prize.contain && "md:object-contain",
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          "absolute top-20 flex flex-col gap-8 whitespace-pre",
          prize.phoneSide === "left"
            ? "left-20 items-start"
            : "right-20 items-end text-right",
          list &&
            "md:left-40 md:right-auto md:top-40 md:items-start md:gap-20 md:text-left",
        )}
      >
        <h3 className="t-h3">
          {phoneTitle === short ? (
            short
          ) : (
            <>
              <span className="md:hidden">{phoneTitle}</span>
              <span className="max-md:hidden">{short}</span>
            </>
          )}
        </h3>
        <p className="text-mute t-note max-md:opacity-80">
          {list ? (
            <>
              <span className="md:hidden">{prize.text.list}</span>
              <span className="max-md:hidden">{prize.text.desktop}</span>
            </>
          ) : (
            prize.text.carousel
          )}
        </p>
      </div>
    </Tilt>
  );
}

/** The four prizes: one under another on a phone, a 2×2 grid on desktop. */
export function PrizeList({ className }: { className?: string }) {
  return (
    <Reveal
      as="ul"
      group
      stagger={0.12}
      className={cn("grid gap-16 md:grid-cols-2 md:gap-20", className)}
    >
      {PRIZES.map((prize) => (
        <li key={prize.id} data-reveal-item="">
          <PrizeCard prize={prize} variant="list" />
        </li>
      ))}
    </Reveal>
  );
}
