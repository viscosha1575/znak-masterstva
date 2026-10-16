"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const tones = {
  brand: "bg-brand",
  green: "bg-ok",
  orange: "bg-warn",
  blue: "bg-info",
};

export type ChartProps = {
  kind: "line" | "bar";
  labels: string[];
  values: number[];
  /** Colour of the bars; lines are always drawn in ink. */
  tone?: keyof typeof tones;
};

/** Round steps for the value axis: 0, 5, 10, 15, 20 rather than 0, 4.25, 8.5… */
function axis(max: number) {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(
    1,
    [1, 2, 2.5, 5, 10].map((size) => size * power).find((s) => s >= rough)!,
  );
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/**
 * A smooth line through the points that never swings past them: between two
 * equal values it stays level, and a peak is a peak, not a wave around one
 * (monotone cubic interpolation, Fritsch–Butland slopes).
 */
function smooth(points: [number, number][]) {
  const count = points.length;
  if (count === 0) return "";
  if (count < 3) {
    return points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  }

  const run = points.slice(1).map(([x], i) => x - points[i][0]);
  const rise = points.slice(1).map(([, y], i) => (y - points[i][1]) / run[i]);
  const slope = points.map((_, i) => {
    if (i === 0) return rise[0];
    if (i === count - 1) return rise[count - 2];
    const [before, after] = [rise[i - 1], rise[i]];
    if (before * after <= 0) return 0;
    const [a, b] = [run[i - 1], run[i]];
    return (3 * (a + b)) / ((2 * b + a) / before + (b + 2 * a) / after);
  });

  return points
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [fromX, fromY] = points[i - 1];
      const third = (x - fromX) / 3;
      return `C${fromX + third},${fromY + slope[i - 1] * third} ${x - third},${y - slope[i] * third} ${x},${y}`;
    })
    .join(" ");
}

function compact(value: number) {
  return value.toLocaleString("ru-RU", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  });
}

/**
 * A line or a bar chart. The drawing is stretched to whatever room it is
 * given; captions and the hover marker are ordinary elements laid over it, so
 * text never stretches with the picture.
 */
export function Chart({ kind, labels, values, tone = "brand" }: ChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const count = values.length;
  const ticks = axis(Math.max(0, ...values));
  const top = ticks[ticks.length - 1];
  const gutter = `${Math.max(...ticks.map((tick) => compact(tick).length)) + 1}ch`;

  // Where point `index` sits across the plot, 0–100: bars stand in the middle
  // of their slots, a line runs from edge to edge.
  const across = (index: number) =>
    kind === "bar"
      ? ((index + 0.5) / count) * 100
      : count > 1
        ? (index / (count - 1)) * 100
        : 50;
  const up = (value: number) => (value / top) * 100;

  const path = smooth(
    values.map((value, index) => [across(index), 100 - up(value)]),
  );

  // About seven captions along the bottom, however many points there are.
  const every = Math.max(1, Math.ceil(count / 7));

  return (
    <div className="relative h-[220px] text-xs font-medium text-mute tabular-nums md:h-[260px]">
      {/* Value axis */}
      <div className="absolute bottom-7 left-0 top-2" style={{ width: gutter }}>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 translate-y-1/2 leading-none"
            style={{ bottom: `${up(tick)}%` }}
          >
            {compact(tick)}
          </span>
        ))}
      </div>

      {/* Plot */}
      <div
        className="absolute bottom-7 right-0 top-2"
        style={{ left: `calc(${gutter} + 0.75rem)` }}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          if (count === 0) return;
          const box = event.currentTarget.getBoundingClientRect();
          const at = ((event.clientX - box.left) / box.width) * 100;
          let nearest = 0;
          for (let index = 1; index < count; index++) {
            if (Math.abs(across(index) - at) < Math.abs(across(nearest) - at)) {
              nearest = index;
            }
          }
          setHover(nearest);
        }}
      >
        {ticks.map((tick) => (
          <div
            key={tick}
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ bottom: `${up(tick)}%` }}
          />
        ))}

        {kind === "line" ? (
          <div className="absolute inset-x-3 inset-y-0">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden
            >
              <path
                d={path}
                fill="none"
                className="stroke-chart"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {hover !== null && (
              <span
                aria-hidden
                className="absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-card bg-chart"
                style={{
                  left: `${across(hover)}%`,
                  bottom: `${up(values[hover])}%`,
                }}
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end">
            {values.map((value, index) => (
              <div
                key={index}
                className="flex h-full flex-1 items-end justify-center"
              >
                <div
                  className={cn(
                    "w-[44%] max-w-12 rounded-t-[10px] transition-opacity duration-150",
                    tones[tone],
                    hover !== null && hover !== index && "opacity-45",
                  )}
                  style={{ height: `${up(value)}%` }}
                />
              </div>
            ))}
          </div>
        )}

        {hover !== null && (
          <div
            role="status"
            className={cn(
              "pointer-events-none absolute z-10 mb-3 rounded-xl bg-[#1b254b] px-3 py-2 text-xs leading-tight whitespace-nowrap text-white shadow-[0_8px_24px_rgb(15_23_42/0.25)] dark:bg-[#0b1437] dark:ring-1 dark:ring-white/15",
              across(hover) > 70
                ? "-translate-x-[calc(100%+0.75rem)]"
                : across(hover) < 30
                  ? "translate-x-3"
                  : "-translate-x-1/2",
            )}
            style={{
              left:
                kind === "line"
                  ? `calc(0.75rem + (100% - 1.5rem) * ${across(hover) / 100})`
                  : `${across(hover)}%`,
              bottom: `${up(values[hover])}%`,
            }}
          >
            <span className="block font-normal text-white/70">
              {labels[hover]}
            </span>
            <span className="block text-sm font-bold">
              {values[hover].toLocaleString("ru-RU")}
            </span>
          </div>
        )}
      </div>

      {/* Captions */}
      <div
        className="absolute bottom-0 right-0 h-4"
        style={{ left: `calc(${gutter} + 0.75rem)` }}
      >
        <div className={cn("relative h-full", kind === "line" && "mx-3")}>
          {labels.map(
            (label, index) =>
              index % every === 0 && (
                <span
                  key={index}
                  className="absolute top-0 -translate-x-1/2 leading-none whitespace-nowrap"
                  style={{ left: `${across(index)}%` }}
                >
                  {label}
                </span>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
