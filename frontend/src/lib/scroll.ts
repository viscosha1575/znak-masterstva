import type Lenis from "lenis";

/*
 * Page scrolling as the rest of the site sees it: whether the inertial wheel
 * scroll (<SmoothScroll>) is running does not concern them.
 */

let lenis: Lenis | null = null;
let locked = false;

/** <SmoothScroll> hands over its instance, or `null` when it lets go of it. */
export function setSmoothScroll(instance: Lenis | null) {
  lenis = instance;
  if (locked) lenis?.stop();
}

/** Freezes the page behind an overlay, such as the open menu. */
export function lockScroll(lock: boolean) {
  locked = lock;
  document.documentElement.toggleAttribute("data-scroll-locked", lock);
  if (lock) lenis?.stop();
  else lenis?.start();
}

/* ---------- What scrolls ---------- */

/*
 * On a touch screen the page does not scroll as a document but inside
 * `#page` (app/layout.tsx, globals.css): a phone browser slides its address
 * bar away while the document scrolls, and here the bar is to stay put.
 * Elsewhere `#page` is a plain box and the document scrolls as usual.
 */

/** The box holding header, page and footer — the scroller on touch screens. */
function pageBox() {
  return document.getElementById("page");
}

/** Whether the page scrolls inside `#page` on this screen. */
export function scrollsInBox(box = pageBox()): box is HTMLElement {
  return !!box && getComputedStyle(box).overflowY !== "visible";
}

/** How far down the page is scrolled, whichever of the two scrolls. */
export function scrollPosition() {
  return window.scrollY + (pageBox()?.scrollTop ?? 0);
}

/** How far down the page can be scrolled at most. */
export function scrollRoom() {
  const box = pageBox();
  return scrollsInBox(box)
    ? box.scrollHeight - box.clientHeight
    : document.documentElement.scrollHeight - window.innerHeight;
}

/*
 * Positions are remembered per address, for Back and Forward and for a
 * reload: the browser puts back a scrolled document by itself, but not a
 * scrolled box. <ScrollMemory> writes them, and puts the page back after a
 * Back or Forward inside the site; the script in app/layout.tsx does it on a
 * reload, before the first paint.
 */
export const SCROLL_KEY = "page-y:";

/** The remembered position of a page, if any. */
export function rememberedPosition(path: string) {
  try {
    const value = Number(sessionStorage.getItem(SCROLL_KEY + path));
    return value > 0 ? value : 0;
  } catch {
    return 0; // storage switched off
  }
}

export function rememberPosition(path: string, y: number) {
  try {
    sessionStorage.setItem(SCROLL_KEY + path, String(Math.round(y)));
  } catch {
    // storage switched off or full: the page then opens at the top
  }
}

/* ---------- Following the scroll, cheaply ---------- */

/*
 * A scroll listener, however small, makes the browser run a full frame on the
 * main thread for every step of the scroll — and on that frame restyle every
 * animation that is playing. Without one a page scrolls and animates on the
 * compositor alone, which is what keeps it smooth on a slow processor.
 *
 * So nothing on the site listens to scrolling as such. The first scroll event
 * starts a look at the position ten times a second, with the listener taken
 * off; when the page has come to rest the looking stops and the listener goes
 * back on, for one event again.
 *
 * The listener catches scroll events on the way down (`capture`), so that it
 * also hears `#page`, whose scroll events do not bubble up to the window. It
 * hears the prize carousel too; a look then finds the page where it was.
 */
const followers = new Set<(y: number) => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let seenAt = -1;
let still = 0;
const ONCE = { passive: true, once: true, capture: true } as const;

function look() {
  const y = scrollPosition();
  if (y === seenAt) {
    still += 1;
    if (still >= 3) {
      clearInterval(timer);
      timer = undefined;
      window.addEventListener("scroll", start, ONCE);
    }
    return;
  }
  still = 0;
  seenAt = y;
  for (const follow of followers) follow(y);
}

function start() {
  if (timer) return;
  still = 0;
  timer = setInterval(look, 100);
  look();
}

/**
 * Calls `follow` with the scroll position while the page is being scrolled:
 * up to ten times a second, and once more where it comes to rest. Returns a
 * function that stops.
 */
export function followScroll(follow: (y: number) => void) {
  if (followers.size === 0 && !timer) {
    window.addEventListener("scroll", start, ONCE);
  }
  followers.add(follow);
  return () => {
    followers.delete(follow);
    if (followers.size > 0) return;
    window.removeEventListener("scroll", start, ONCE);
    clearInterval(timer);
    timer = undefined;
  };
}
