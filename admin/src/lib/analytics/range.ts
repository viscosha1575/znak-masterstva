import "server-only";

import { addDays, stats, today } from "@/lib/analytics/store";
import { type Preset, PRESETS, type Range } from "@/lib/analytics/types";

export type { Preset, Range };

export const DEFAULT_PRESET: Preset = "7d";

function isDay(value: string | undefined): value is string {
  return (
    value !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
}

/** The first day anything was recorded on; today while the log is empty. */
function firstDay() {
  return (
    stats.get<{ day: string | null }>("SELECT MIN(day) AS day FROM daily")
      ?.day ?? today()
  );
}

export function presetRange(preset: Preset): Range {
  const to = today();
  const from =
    preset === "today"
      ? to
      : preset === "7d"
        ? addDays(to, -6)
        : preset === "30d"
          ? addDays(to, -29)
          : firstDay();
  return { preset, from, to };
}

/** The range an address asks for: `?range=30d`, or `?from=…&to=…` picked by hand. */
export function parseRange(
  params: { range?: string; from?: string; to?: string },
  fallback: Preset = DEFAULT_PRESET,
): Range {
  if (isDay(params.from) || isDay(params.to)) {
    const now = today();
    const to = isDay(params.to) && params.to < now ? params.to : now;
    const from = isDay(params.from) && params.from < to ? params.from : to;
    return { preset: null, from, to };
  }
  const preset = PRESETS.find(({ id }) => id === params.range)?.id;
  return presetRange(preset ?? fallback);
}

/** Every day of a range, in order. */
export function daysOf(range: Range) {
  const days: string[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}
