import "server-only";

import { onlineNow } from "@/lib/analytics/ingest";
import { daysOf, type Range } from "@/lib/analytics/range";
import { hourOf, stats, today } from "@/lib/analytics/store";

/*
 * The numbers of the statistics page. Everything here reads the counters
 * (see store.ts): a handful of rows per day of the range, however many visits
 * those days saw.
 */

const SCALARS = [
  "visits",
  "visitors",
  "new_visitors",
  "views",
  "clicks",
  "events",
  "engaged",
  "active_ms",
  "form_open",
  "form_start",
  "form_submit",
  "form_sent",
  "applications",
] as const;

type Scalar = (typeof SCALARS)[number];

export type Totals = Record<Scalar, number>;

/** Sums of the plain counters over a range. */
export function totals(range: Range): Totals {
  const sums = Object.fromEntries(SCALARS.map((name) => [name, 0])) as Totals;
  for (const row of stats.all<{ metric: string; value: number }>(
    `SELECT metric, SUM(value) AS value FROM daily
     WHERE day BETWEEN :from AND :to GROUP BY metric`,
    { from: range.from, to: range.to },
  )) {
    if (row.metric in sums) sums[row.metric as Scalar] = row.value;
  }

  // Daily visitor counts cannot simply be added up: someone who came on three
  // days would count three times. The 'uniq' rows make the sum exact — each
  // visitor is taken once, on their first day inside the range.
  sums.visitors =
    stats.get<{ value: number | null }>(
      `SELECT SUM(value) AS value FROM daily_by
       WHERE metric = 'uniq' AND day BETWEEN :from AND :to AND key < :from`,
      { from: range.from, to: range.to },
    )?.value ?? 0;
  return sums;
}

export type Series = {
  labels: string[];
  /** One list of values per metric, as long as `labels`. */
  values: Record<string, number[]>;
  /** Hours of a single day rather than days of a range. */
  hourly: boolean;
};

const CHARTED = ["visits", "visitors", "new_visitors", "views", "applications"];

function dayLabel(day: string) {
  return `${day.slice(8, 10)}.${day.slice(5, 7)}`;
}

/** The charts' data: by the hour for a single day, by the day otherwise. */
export function series(range: Range): Series {
  const values: Record<string, number[]> = {};

  if (range.from === range.to) {
    // Today stops at the current hour: the rest has not happened yet.
    const hours = range.to === today() ? hourOf(Date.now()) + 1 : 24;
    for (const metric of CHARTED) values[metric] = Array(hours).fill(0);
    for (const row of stats.all<{
      hour: number;
      metric: string;
      value: number;
    }>("SELECT hour, metric, value FROM hourly WHERE day = :day", {
      day: range.from,
    })) {
      if (row.hour < hours && values[row.metric]) {
        values[row.metric][row.hour] = row.value;
      }
    }
    return {
      labels: Array.from(
        { length: hours },
        (_, hour) => `${String(hour).padStart(2, "0")}:00`,
      ),
      values,
      hourly: true,
    };
  }

  const days = daysOf(range);
  const index = new Map(days.map((day, position) => [day, position]));
  for (const metric of CHARTED) values[metric] = Array(days.length).fill(0);
  for (const row of stats.all<{ day: string; metric: string; value: number }>(
    "SELECT day, metric, value FROM daily WHERE day BETWEEN :from AND :to",
    { from: range.from, to: range.to },
  )) {
    const position = index.get(row.day);
    if (position !== undefined && values[row.metric]) {
      values[row.metric][position] = row.value;
    }
  }
  return { labels: days.map(dayLabel), values, hourly: false };
}

export type TopRow = { key: string; value: number };

/** The biggest values of a breakdown: pages, sources, devices, clicks. */
export function top(metric: string, range: Range, limit: number): TopRow[] {
  return stats.all<TopRow>(
    `SELECT key, SUM(value) AS value FROM daily_by
     WHERE metric = :metric AND day BETWEEN :from AND :to
     GROUP BY key ORDER BY value DESC, key LIMIT :limit`,
    { metric, from: range.from, to: range.to, limit },
  );
}

/** How many events of each type the range holds. */
export function eventCounts(range: Range) {
  return new Map(top("type", range, 50).map((row) => [row.key, row.value]));
}

export { onlineNow };
