import type { Metadata } from "next";
import Link from "next/link";
import { UtmBadges, VisitBadges } from "@/components/analytics/Marks";
import {
  Empty,
  Fact,
  Pager,
  Panel,
  Pill,
  Stat,
} from "@/components/panel/Blocks";
import { FilterBar } from "@/components/panel/FilterBar";
import { RangeBar } from "@/components/panel/RangeBar";
import { Notice } from "@/components/ui/Notice";
import { listVisits, type VisitFilter } from "@/lib/analytics/log";
import { plain, positive, withParams } from "@/lib/analytics/params";
import { parseRange } from "@/lib/analytics/range";
import { top, totals } from "@/lib/analytics/report";
import { DEVICE_TITLES, sourceTitle, utmTitle } from "@/lib/analytics/types";
import { findUtm } from "@/lib/analytics/utm";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatClock, formatDuration } from "@/lib/format";

export const metadata: Metadata = { title: "Сессии" };

// A direct visit has an empty source, and an empty parameter means "any".
const DIRECT = "-";

export default async function SessionsPage(props: PageProps<"/sessions">) {
  await requireUser();
  const params = plain(await props.searchParams);
  const range = parseRange(params, "all");
  // The address of this list without a place in it: filters and period only.
  const view = { ...params, before: undefined };

  const filter: VisitFilter = {
    range,
    applied: params.applied === "1",
    visitorId: positive(params.visitor),
    utmId: positive(params.utm),
    device:
      params.device && params.device in DEVICE_TITLES
        ? params.device
        : undefined,
    source:
      params.source === undefined
        ? undefined
        : params.source === DIRECT
          ? ""
          : params.source,
  };
  const page = listVisits(filter, positive(params.before));
  const sums = totals(range);
  const tag = filter.utmId ? findUtm(filter.utmId) : undefined;

  // Sources worth offering: the busiest of the period, plus the one picked.
  const sources = top("source", range, 30).map((row) => row.key);
  if (filter.source !== undefined && !sources.includes(filter.source)) {
    sources.push(filter.source);
  }

  return (
    <div className="flex flex-col gap-5">
      <RangeBar
        path="/sessions"
        range={range}
        params={{ ...view, range: undefined, from: undefined, to: undefined }}
        updated={formatClock()}
      />

      <FilterBar
        path="/sessions"
        params={view}
        selects={[
          {
            name: "source",
            label: "Источник",
            options: [
              { value: "", title: "Все источники" },
              ...sources.map((source) => ({
                value: source || DIRECT,
                title: sourceTitle(source),
              })),
            ],
          },
          {
            name: "device",
            label: "Устройство",
            options: [
              { value: "", title: "Все устройства" },
              ...Object.entries(DEVICE_TITLES).map(([value, title]) => ({
                value,
                title,
              })),
            ],
          },
          {
            name: "applied",
            label: "Итог",
            options: [
              { value: "", title: "С любым итогом" },
              { value: "1", title: "Только с заявкой" },
            ],
          },
        ]}
      />

      {(filter.visitorId !== undefined || tag) && (
        <Notice>
          {filter.visitorId !== undefined &&
            `Показаны сессии посетителя № ${filter.visitorId}. `}
          {tag && `Показаны сессии по метке ${utmTitle(tag)}. `}
          <Link
            href={withParams("/sessions", view, {
              visitor: undefined,
              utm: undefined,
            })}
            className="font-bold text-accent underline-offset-4 hover:underline"
          >
            Показать все
          </Link>
        </Notice>
      )}

      <section
        aria-label="Итоги периода"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <Stat label="Сессий" value={sums.visits} />
        <Stat label="Посетителей" value={sums.visitors} />
        <Stat label="Новых посетителей" value={sums.new_visitors} />
        <Stat label="Сессий с заявкой" value={sums.form_sent} />
      </section>

      <Panel
        title="Сессии"
        lead="Каждый заход на сайт: откуда пришёл посетитель и что делал. Новые сверху."
        aside={params.before && <Pill>Раньше сессии № {params.before}</Pill>}
      >
        {page.items.length > 0 ? (
          <ul className="flex flex-col gap-3.5">
            {page.items.map((visit) => (
              <li key={visit.id}>
                <Link
                  href={`/sessions/${visit.id}`}
                  className={cn(
                    "card flex flex-col gap-3 border border-transparent p-3.5 transition-[transform,box-shadow,background-color] duration-200 md:gap-4 md:p-[22px] xl:flex-row xl:items-center xl:gap-[18px]",
                    "hover:-translate-y-px hover:bg-subtle hover:shadow-[0_20px_40px_rgb(112_144_176/0.16)] active:translate-y-0 dark:hover:shadow-none",
                  )}
                >
                  <div className="min-w-0 xl:w-52 xl:shrink-0">
                    <p className="truncate text-lg leading-tight font-bold text-ink md:text-xl">
                      Сессия № {visit.id}
                    </p>
                    <p className="mt-1 truncate text-xs text-mute md:text-sm">
                      Посетитель № {visit.visitorId}
                    </p>
                  </div>
                  <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3.5 gap-y-2.5 md:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_9.5rem]">
                    <Fact label="Источник">
                      {visit.utm ? (
                        <UtmBadges utm={visit.utm} />
                      ) : (
                        sourceTitle(visit.source)
                      )}
                    </Fact>
                    <Fact label="Вход">{visit.landing}</Fact>
                    <Fact label="Действия">
                      {visit.views} стр. · {visit.clicks} кл.
                    </Fact>
                    <Fact label="Время">{formatDuration(visit.activeMs)}</Fact>
                    <Fact label="Начало, мск">
                      <span className="tabular-nums">
                        {formatClock(visit.startedAt)}
                      </span>
                    </Fact>
                  </dl>
                  <div className="xl:w-40 xl:shrink-0">
                    <VisitBadges visit={visit} />
                    <p className="mt-1.5 text-xs text-mute">
                      {DEVICE_TITLES[visit.device] ?? visit.device} ·{" "}
                      {visit.browser}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            {page.searchedTo
              ? "В этой части лога подходящих сессий нет."
              : "Сессий под эти условия нет."}
          </Empty>
        )}

        {page.searchedTo && (
          <Notice className="mt-[18px]">
            Поиск просмотрел сессии до № {page.searchedTo} и взял паузу, чтобы
            не заставлять ждать. Нажмите «Дальше», чтобы искать в более ранних.
          </Notice>
        )}

        <Pager
          note="Порядок: сначала новые"
          previous={params.before ? withParams("/sessions", view) : undefined}
          previousLabel="В начало"
          next={
            page.next
              ? withParams("/sessions", view, { before: page.next })
              : undefined
          }
          nextLabel="Дальше"
        />
      </Panel>
    </div>
  );
}
