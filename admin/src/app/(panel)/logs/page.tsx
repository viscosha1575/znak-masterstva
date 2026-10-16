import type { Metadata } from "next";
import Link from "next/link";
import { EventBadge, eventDetails } from "@/components/analytics/Marks";
import { Empty, Pager, Panel, Pill, Stat } from "@/components/panel/Blocks";
import { FilterBar } from "@/components/panel/FilterBar";
import { RangeBar } from "@/components/panel/RangeBar";
import { Badge } from "@/components/ui/Badge";
import { Notice } from "@/components/ui/Notice";
import { type EventFilter, listEvents } from "@/lib/analytics/log";
import { plain, positive, withParams } from "@/lib/analytics/params";
import { parseRange } from "@/lib/analytics/range";
import { totals } from "@/lib/analytics/report";
import {
  EVENT_TITLES,
  EVENT_TYPES,
  isEventType,
  sourceTitle,
} from "@/lib/analytics/types";
import { requireUser } from "@/lib/auth";
import { formatClock } from "@/lib/format";

export const metadata: Metadata = { title: "Логи" };

export default async function LogsPage(props: PageProps<"/logs">) {
  await requireUser();
  const params = plain(await props.searchParams);
  const range = parseRange(params, "all");
  // The address of this list without a place in it: filters and period only.
  const view = { ...params, before: undefined };

  const filter: EventFilter = {
    range,
    type: params.type && isEventType(params.type) ? params.type : undefined,
    sessionId: positive(params.session),
    visitorId: positive(params.visitor),
    query: params.q,
  };
  const page = listEvents(filter, positive(params.before));
  const sums = totals(range);

  return (
    <div className="flex flex-col gap-5">
      <RangeBar
        path="/logs"
        range={range}
        params={{ ...view, range: undefined, from: undefined, to: undefined }}
        updated={formatClock()}
      />

      <FilterBar
        path="/logs"
        params={view}
        search={{
          name: "q",
          placeholder: "Поиск по странице, кнопке или ссылке",
        }}
        selects={[
          {
            name: "type",
            label: "Действие",
            options: [
              { value: "", title: "Все действия" },
              ...EVENT_TYPES.map((type) => ({
                value: type,
                title: EVENT_TITLES[type],
              })),
            ],
          },
        ]}
      />

      {(filter.sessionId !== undefined || filter.visitorId !== undefined) && (
        <Notice>
          {filter.sessionId !== undefined
            ? `Показаны события сессии № ${filter.sessionId}. `
            : `Показаны события посетителя № ${filter.visitorId}. `}
          <Link
            href={withParams("/logs", view, {
              session: undefined,
              visitor: undefined,
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
        <Stat label="Всего событий" value={sums.events} />
        <Stat label="Просмотров страниц" value={sums.views} />
        <Stat label="Кликов" value={sums.clicks} />
        <Stat label="Отправленных заявок" value={sums.applications} />
      </section>

      <Panel
        title="Журнал событий"
        lead="Всё, что посетители делают на сайте. Новые сверху."
        aside={params.before && <Pill>Раньше события № {params.before}</Pill>}
      >
        {page.items.length > 0 ? (
          <div className="-mx-[18px] overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[56rem]">
              <thead>
                <tr>
                  <th className="th">Время, мск</th>
                  <th className="th">Событие</th>
                  <th className="th">Посетитель</th>
                  <th className="th">Страница</th>
                  <th className="th">Источник</th>
                  <th className="th">Детали</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((event) => (
                  <tr key={event.id}>
                    <td className="td whitespace-nowrap text-mute tabular-nums">
                      {formatClock(event.at)}
                    </td>
                    <td className="td">
                      <EventBadge type={event.type} />
                    </td>
                    <td className="td whitespace-nowrap">
                      <Link
                        href={`/sessions/${event.sessionId}`}
                        className="block font-bold text-ink underline-offset-4 hover:underline"
                      >
                        {event.visitorId === null
                          ? "—"
                          : `Посетитель № ${event.visitorId}`}
                      </Link>
                      <span className="block text-xs text-mute">
                        Сессия № {event.sessionId}
                      </span>
                    </td>
                    <td className="td break-all text-soft">{event.path}</td>
                    <td className="td">
                      <Badge verbatim>{sourceTitle(event.source ?? "")}</Badge>
                    </td>
                    <td className="td break-words text-soft">
                      {event.type === "sent" && event.value ? (
                        <Link
                          href={`/applications/${event.value}`}
                          className="font-bold text-accent underline-offset-4 hover:underline"
                        >
                          {eventDetails(event)}
                        </Link>
                      ) : (
                        eventDetails(event) || "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            {page.searchedTo
              ? "В этой части лога подходящих событий нет."
              : "Событий под эти условия нет."}
          </Empty>
        )}

        {page.searchedTo && (
          <Notice className="mt-[18px]">
            Поиск просмотрел события до № {page.searchedTo} и взял паузу, чтобы
            не заставлять ждать. Нажмите «Дальше», чтобы искать в более ранних.
          </Notice>
        )}

        <Pager
          note="Порядок: сначала новые"
          previous={params.before ? withParams("/logs", view) : undefined}
          previousLabel="В начало"
          next={
            page.next
              ? withParams("/logs", view, { before: page.next })
              : undefined
          }
          nextLabel="Дальше"
        />
      </Panel>
    </div>
  );
}
