/*
 * Dates are stored in UTC and shown by the Moscow clock, whatever the server's
 * or the viewer's own time zone is: colleagues in different cities must read
 * the same time. The long format says "мск"; short ones sit under a labelled
 * column.
 */
const ZONE = "Europe/Moscow";

const dateTime = new Intl.DateTimeFormat("ru-RU", {
  timeZone: ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateTime = new Intl.DateTimeFormat("ru-RU", {
  timeZone: ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** 11 октября 2026 г. в 14:05 мск */
export function formatDateTime(iso: string) {
  return `${dateTime.format(new Date(iso))} мск`;
}

/** 11.10.2026, 14:05 */
export function formatShortDateTime(iso: string) {
  return shortDateTime.format(new Date(iso));
}

/** The Moscow calendar day of a moment, as YYYY-MM-DD. */
export function moscowDay(date: Date) {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/** "5 заявок", "1 заявка", "2 заявки". */
export function plural(count: number, one: string, few: string, many: string) {
  const tens = Math.abs(count) % 100;
  const units = tens % 10;
  const word =
    tens > 10 && tens < 20
      ? many
      : units === 1
        ? one
        : units >= 2 && units <= 4
          ? few
          : many;
  return `${count.toLocaleString("ru-RU")} ${word}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Кб`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Мб`;
}

/** How long ago, in words: "только что", "3 часа назад", "5 дней назад". */
export function formatAge(iso: string, from = new Date()) {
  const minutes = Math.floor(
    (from.getTime() - new Date(iso).getTime()) / 60_000,
  );
  if (minutes < 1) return "только что";
  if (minutes < 60) {
    return `${plural(minutes, "минуту", "минуты", "минут")} назад`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${plural(hours, "час", "часа", "часов")} назад`;
  return `${plural(Math.floor(hours / 24), "день", "дня", "дней")} назад`;
}

const clock = new Intl.DateTimeFormat("ru-RU", {
  timeZone: ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** 11.10.2026, 14:05:09 — to the second, for logs. Takes a date or Unix milliseconds; now by default. */
export function formatClock(moment: Date | number = Date.now()) {
  return clock.format(moment);
}

/** How long something lasted: "45 с", "3 мин 20 с", "1 ч 05 мин". */
export function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} с`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин ${seconds % 60} с`;
  return `${Math.floor(minutes / 60)} ч ${String(minutes % 60).padStart(2, "0")} мин`;
}

/** A share as a percentage: "12,5 %". A dash when there is nothing to divide by. */
export function formatShare(part: number, whole: number) {
  if (whole <= 0) return "—";
  return `${((part / whole) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} %`;
}
