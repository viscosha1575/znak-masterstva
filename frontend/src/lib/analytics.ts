"use client";

/*
 * The site's own visit statistics: which pages are opened, what gets clicked,
 * how far visitors scroll and how they move through the application form.
 * Batches go to /api/activity and on to the admin panel, which keeps them
 * (see ../admin/src/lib/analytics). Nothing leaves for a third party.
 *
 * What is sent describes the site, not the person: page addresses, the labels
 * of the buttons and links pressed, the names of form fields that failed.
 * Nothing typed into the form is ever read here.
 */

import { followScroll, scrollRoom } from "@/lib/scroll";

type Kind =
  | "view"
  | "click"
  | "scroll"
  | "form_start"
  | "form_submit"
  | "form_error"
  | "leave";

type Details = { label?: string; target?: string; value?: number };

type Item = Details & { type: Kind; path: string; at: number };

const ENDPOINT = "/api/activity";
// The server takes fifty events a batch; a page never has that many waiting.
const BATCH = 40;

// Off on the server, where this module is also evaluated, and in a browser
// driven by a script: that is a test or a crawler, not a visitor.
const enabled = typeof window !== "undefined" && !navigator.webdriver;

const queue: Item[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
/** When the pending batch is due; a later request never pushes it back. */
let due = Infinity;
let sending = false;
/** How the visitor got here — sent once, with the first batch of the page load. */
let entry = enabled ? arrival() : undefined;

function arrival() {
  const params = new URLSearchParams(location.search);
  const utm = Object.fromEntries(
    ["source", "medium", "campaign", "content", "term"].map((name) => [
      name,
      params.get(`utm_${name}`) ?? "",
    ]),
  );

  // Moving between our own pages is not "coming from" anywhere.
  let referrer = "";
  if (document.referrer && URL.canParse(document.referrer)) {
    if (new URL(document.referrer).host !== location.host) {
      referrer = document.referrer;
    }
  }
  return { referrer, utm, screen: `${screen.width}x${screen.height}` };
}

function take() {
  const now = Date.now();
  const events = queue
    .splice(0, BATCH)
    .map(({ at, ...event }) => ({ ...event, ago: Math.max(0, now - at) }));
  const body = JSON.stringify({ entry, events });
  entry = undefined;
  return body;
}

function schedule(delay: number) {
  const at = Date.now() + delay;
  if (at >= due) return;
  clearTimeout(timer);
  due = at;
  timer = setTimeout(() => {
    due = Infinity;
    void send();
  }, delay);
}

async function send() {
  if (sending || queue.length === 0) return;
  sending = true;
  try {
    // Whatever the answer, the batch is spent: a refusal would only repeat.
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: take(),
      keepalive: true,
    });
  } catch {
    // Offline. Statistics are not worth a retry queue.
  } finally {
    sending = false;
    if (queue.length > 0) schedule(1000);
  }
}

/** The page is going away: hand what is left to the browser to deliver. */
function sendNow() {
  clearTimeout(timer);
  due = Infinity;
  while (queue.length > 0) {
    const body = new Blob([take()], { type: "application/json" });
    if (!navigator.sendBeacon(ENDPOINT, body)) break;
  }
}

/** Notes something the visitor did. Safe to call anywhere; cheap to call often. */
export function track(type: Kind, details: Details = {}, path?: string) {
  if (!enabled) return;
  queue.push({
    ...details,
    type,
    path: path ?? location.pathname,
    at: Date.now(),
  });
  // A page view opens the visit, so it goes out at once; the rest can wait
  // for company.
  schedule(type === "view" ? 300 : 2500);
}

/* ---------- Pages and the time spent on them ---------- */

let page = "";
/** When the current page last came on screen; `null` while the tab is hidden. */
let shownAt: number | null = null;
/** The deepest scroll mark reported for the current page. */
let depth = 0;

function closePage() {
  if (!page || shownAt === null) return;
  const spent = Math.round(performance.now() - shownAt);
  shownAt = null;
  if (spent >= 1000) track("leave", { value: spent }, page);
}

/** Called on every navigation, the first load included. */
export function openPage(path: string) {
  // The same page twice in a row is React re-running an effect, not a visit.
  if (!enabled || path === page) return;
  closePage();
  page = path;
  depth = 0;
  shownAt = document.visibilityState === "visible" ? performance.now() : null;
  track("view", {}, path);
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    closePage();
    sendNow();
  } else if (page) {
    shownAt = performance.now();
  }
}

function onPageHide() {
  closePage();
  sendNow();
}

/* ---------- Clicks ---------- */

const CLICKABLE =
  'a, button, summary, [role="button"], [role="option"], [role="tab"], input[type="submit"], [data-track]';

function clean(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function labelOf(element: Element) {
  return (
    // data-track names an element whose own text would say too much.
    clean(element.getAttribute("data-track")) ||
    clean(element.getAttribute("aria-label")) ||
    clean(element.textContent) ||
    clean(element.querySelector("img")?.alt) ||
    element.tagName.toLowerCase()
  );
}

/** Where a link leads: a page of ours, or another site — without its query. */
function targetOf(element: Element) {
  const link = element.closest("a");
  if (!link?.href || !URL.canParse(link.href)) return "";
  const url = new URL(link.href);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return url.protocol;
  }
  return url.host === location.host
    ? url.pathname + url.hash
    : url.host + url.pathname;
}

function onClick(event: MouseEvent) {
  const element =
    event.target instanceof Element ? event.target.closest(CLICKABLE) : null;
  if (!element) return;
  track("click", { label: labelOf(element), target: targetOf(element) });
}

/* ---------- Scroll depth ---------- */

// Called a few times a second while the page scrolls, and where it comes to
// rest (lib/scroll.ts).
function measure(y: number) {
  const room = scrollRoom();
  // A page that barely scrolls has no depth to speak of.
  if (room < 200) return;
  const reached = Math.floor(((y / room) * 100 + 1) / 25) * 25;
  if (reached > depth) {
    depth = Math.min(100, reached);
    track("scroll", { value: depth });
  }
}

/** Starts listening. Returns the function that stops. */
export function listen() {
  if (!enabled) return () => {};
  document.addEventListener("click", onClick, true);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  const unfollow = followScroll(measure);
  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    unfollow();
  };
}
