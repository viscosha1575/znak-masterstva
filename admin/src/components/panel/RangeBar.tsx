"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonClass } from "@/components/ui/Button";
import { PRESETS, type Range } from "@/lib/analytics/types";
import { cn } from "@/lib/cn";

type RangeBarProps = {
  /** The page the bar sits on, e.g. "/statistics". */
  path: string;
  range: Range;
  /** The page's other query parameters, kept when the period changes. */
  params?: Record<string, string | undefined>;
  /** When the numbers on the page were read, ready to show. */
  updated: string;
};

/**
 * The period of a report: quick spans on the left, exact dates and "refresh"
 * on the right. The address bar holds the choice, so a report can be linked.
 */
export function RangeBar({ path, range, params, updated }: RangeBarProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const address = (period: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries({ ...params, ...period })) {
      if (value) query.set(name, value);
    }
    return `${path}?${query}`;
  };

  const date =
    "float w-full min-w-0 px-3 font-semibold shadow-control md:w-[150px] dark:[color-scheme:light]";

  return (
    // The two halves wrap as wholes: dates never end up between the spans.
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="grid grid-cols-4 gap-2 max-md:w-full md:flex md:flex-wrap md:gap-3">
        {PRESETS.map((preset) => {
          const current = range.preset === preset.id;
          return (
            <Link
              key={preset.id}
              href={address({ range: preset.id })}
              aria-current={current ? "true" : undefined}
              className={buttonClass({
                variant: current ? "primary" : "float",
                size: "sm",
                className: cn(
                  "max-md:px-1 max-md:text-[0.8125rem]",
                  current && "shadow-brand",
                ),
              })}
            >
              {preset.title}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-md:w-full md:flex md:flex-wrap md:items-center">
        {/* Keyed by the range: a preset or Back puts its own dates in. */}
        <input
          key={`from ${range.from}`}
          type="date"
          aria-label="Начало периода"
          defaultValue={range.from}
          max={range.to}
          onChange={(event) => {
            if (event.target.value) {
              router.push(address({ from: event.target.value, to: range.to }));
            }
          }}
          className={date}
        />
        <input
          key={`to ${range.to}`}
          type="date"
          aria-label="Конец периода"
          defaultValue={range.to}
          min={range.from}
          onChange={(event) => {
            if (event.target.value) {
              router.push(
                address({ from: range.from, to: event.target.value }),
              );
            }
          }}
          className={date}
        />
        <span className="float flex items-center justify-center rounded-full px-3 text-xs font-bold whitespace-nowrap uppercase tabular-nums max-md:text-[0.625rem]">
          Обновлено: {updated}
        </span>
        <button
          type="button"
          disabled={refreshing}
          onClick={() => startRefresh(() => router.refresh())}
          className={buttonClass({ variant: "float", size: "sm" })}
        >
          {refreshing ? "Обновляем…" : "Обновить"}
        </button>
      </div>
    </div>
  );
}
