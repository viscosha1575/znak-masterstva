import type { StaticImageData } from "next/image";
import badge from "./images/badge.webp";
import disc from "./images/disc.webp";
import badgePhone from "./images/mobile/badge.webp";
import moneyPhone from "./images/mobile/money.webp";
import passPhone from "./images/mobile/pass.webp";
import plaquePhone from "./images/mobile/plaque.webp";
import podiumPhone from "./images/mobile/podium.webp";
import statuettePhone from "./images/mobile/statuette.webp";
import streakPhone from "./images/mobile/streak.webp";
import suitcasePhone from "./images/mobile/suitcase.webp";
import trophyPhone from "./images/mobile/trophy.webp";
import money from "./images/money.webp";
import pass from "./images/pass.webp";
import plaque from "./images/plaque.webp";
import podium from "./images/podium.webp";
import statuette from "./images/statuette.webp";
import streak from "./images/streak.webp";
import suitcase from "./images/suitcase.webp";
import trophy from "./images/trophy.webp";

/**
 * A render: the full-size file, and — where the picture is large — a much
 * lighter cut for phones, about twice as wide as it is shown on a 360 px
 * screen (glossy renders gain nothing visible from a 3× file).
 *
 * The prizes keep the proportions Figma exports them in, which are not the
 * proportions they are shown in: the mockup stretches each to the size of its
 * box, and so does the layout — give them a width and a height, not
 * `object-cover`. (The statuette, the pass and the suitcase differ a little
 * between the two mockups, so their two cuts are not the same picture.)
 */
export type Art = { src: StaticImageData; phone?: StaticImageData };

export const ART = {
  plaque: { src: plaque, phone: plaquePhone },
  podium: { src: podium, phone: podiumPhone },
  trophy: { src: trophy, phone: trophyPhone },
  badge: { src: badge, phone: badgePhone },
  statuette: { src: statuette, phone: statuettePhone },
  suitcase: { src: suitcase, phone: suitcasePhone },
  pass: { src: pass, phone: passPhone },
  money: { src: money, phone: moneyPhone },
  streak: { src: streak, phone: streakPhone },
  disc: { src: disc },
} satisfies Record<string, Art>;
