import { scrollsInBox } from "@/lib/scroll";

/*
 * What the animations share. Almost all motion on the site is CSS that the
 * browser runs off the main thread — transitions and keyframes of transform
 * and opacity. Scripts only flip an attribute when something comes into view
 * or set a custom property when the cursor moves; none of them works every
 * frame, so the page is idle when nothing is being touched and stays smooth
 * on a slow processor.
 */

/** Animations are only wired up when the visitor has not asked for less motion. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
/** Pointer-driven effects (tilt, turn, magnet) need a real hovering cursor. */
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Runs `setup` for as long as the media query holds; what it returns undoes
 * it. Returns a function that stops watching.
 */
export function whileMedia(query: string, setup: () => void | (() => void)) {
  const media = window.matchMedia(query);
  let undo: void | (() => void);
  const sync = () => {
    undo?.();
    undo = media.matches ? setup() : undefined;
  };
  sync();
  media.addEventListener("change", sync);
  return () => {
    media.removeEventListener("change", sync);
    undo?.();
  };
}

/* ---------- Seen once ---------- */

const waiting = new Map<Element, () => void>();
const observers = new Map<number, IntersectionObserver>();
let ending: { observer: IntersectionObserver; mark: HTMLElement } | undefined;

function show(el: Element) {
  const enter = waiting.get(el);
  if (!enter) return;
  forget(el);
  enter();
}

function forget(el: Element) {
  if (!waiting.delete(el)) return;
  for (const observer of observers.values()) observer.unobserve(el);
  if (waiting.size === 0 && ending) {
    ending.observer.disconnect();
    ending.mark.remove();
    ending = undefined;
  }
}

function observerFor(line: number) {
  let observer = observers.get(line);
  if (!observer) {
    // Where the page scrolls inside #page (touch screens, lib/scroll.ts), the
    // box clips whatever has gone by above it, so the margin below would not
    // reach up there unless the box itself is the root.
    const box = document.getElementById("page");
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(entry.target);
        }
      },
      {
        root: scrollsInBox(box) ? box : null,
        // The viewport up to the line — and everything above it: what has
        // been scrolled past, or jumped over, counts as seen too.
        rootMargin: `1000000px 0px ${(line - 1) * 100}% 0px`,
      },
    );
    observers.set(line, observer);
  }
  return observer;
}

/*
 * What sits in the last stretch of a page never crosses its line: the page
 * runs out first (the last button on a tall phone, everything on a page too
 * short to scroll). A mark at the very end of the page tells when the page
 * can go no further; whatever is on screen then is shown. It goes into #page,
 * which on a touch screen is what scrolls (lib/scroll.ts): at the end of the
 * body it would sit on the bottom edge of the screen all along.
 */
function watchTheEnd() {
  if (ending) return;
  const mark = document.createElement("div");
  mark.setAttribute("aria-hidden", "true");
  // One pixel tall and pulled back by as much: the page is no longer for it.
  mark.style.cssText = "height:1px;margin-top:-1px;pointer-events:none";
  (document.getElementById("page") ?? document.body).append(mark);
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    for (const el of [...waiting.keys()]) {
      if (el.getBoundingClientRect().top < window.innerHeight) show(el);
    }
  });
  observer.observe(mark);
  ending = { observer, mark };
}

/**
 * Calls `enter` once: the first time the top of `el` rises past `line` (a
 * fraction of the viewport height, from the top). Returns a function that
 * stops waiting.
 */
export function whenSeen(el: Element, enter: () => void, line = 0.86) {
  // Not rendered on this layout: nothing to animate. Should it appear after a
  // resize, it is simply there.
  if (el.getClientRects().length === 0) {
    enter();
    return () => {};
  }

  waiting.set(el, enter);
  observerFor(line).observe(el);
  watchTheEnd();

  return () => forget(el);
}
