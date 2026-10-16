/*
 * The vocabulary of the visit log, shared by the code that writes it and the
 * pages that show it.
 */

/** What the site reports about a visit. */
export const CLIENT_EVENTS = [
  "view",
  "click",
  "scroll",
  "form_start",
  "form_submit",
  "form_error",
  "leave",
] as const;

/** `sent` is written by the panel itself, when an application is saved. */
export const EVENT_TYPES = [...CLIENT_EVENTS, "sent"] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TITLES: Record<EventType, string> = {
  view: "Просмотр страницы",
  click: "Клик",
  scroll: "Прокрутка",
  form_start: "Начал анкету",
  form_submit: "Нажал «Отправить»",
  form_error: "Ошибка в анкете",
  sent: "Заявка отправлена",
  leave: "Ушёл со страницы",
};

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}

/** The page with the application form: opening it is the funnel's first step. */
export const FORM_PATH = "/apply";

/** A visit ends after this long without a sign of the visitor. */
export const SESSION_GAP = 30 * 60 * 1000;

export const DEVICE_TITLES: Record<string, string> = {
  desktop: "Компьютер",
  mobile: "Телефон",
  tablet: "Планшет",
};

/** The five UTM tags, in the order they are usually read. */
export const UTM_FIELDS = [
  "source",
  "medium",
  "campaign",
  "content",
  "term",
] as const;

export type Utm = Record<(typeof UTM_FIELDS)[number], string>;

/** Where an application came from, kept with the application itself. */
export type Origin = {
  visitorId: number;
  sessionId: number;
  /** utm_source, the referring site, or "" for a direct visit. */
  source: string;
  utm: Utm | null;
  referrer: string;
  landing: string;
  device: string;
  browser: string;
  os: string;
  /** Which of the visitor's visits this was. */
  visit: number;
};

export function sourceTitle(source: string) {
  return source || "Прямой заход";
}

/** "yandex / cpc / spring" — the tags that are set, most general first. */
export function utmTitle(utm: Utm) {
  return [utm.source, utm.medium, utm.campaign].filter(Boolean).join(" / ");
}

/* ---------- Periods ---------- */

export const PRESETS = [
  { id: "today", title: "Сегодня" },
  { id: "7d", title: "7 дней" },
  { id: "30d", title: "30 дней" },
  { id: "all", title: "Всё время" },
] as const;

export type Preset = (typeof PRESETS)[number]["id"];

/** A span of Moscow calendar days, both ends included. */
export type Range = {
  /** `null` when the dates were picked by hand. */
  preset: Preset | null;
  from: string;
  to: string;
};
