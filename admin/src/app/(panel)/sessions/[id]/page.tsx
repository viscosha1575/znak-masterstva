import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import {
  EventBadge,
  eventDetails,
  UtmBadges,
  VisitBadges,
} from "@/components/analytics/Marks";
import {
  Empty,
  Fact,
  formatNumber,
  Panel,
  Pill,
  Stat,
} from "@/components/panel/Blocks";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  findVisit,
  findVisitor,
  listVisits,
  visitEvents,
} from "@/lib/analytics/log";
import { DEVICE_TITLES, sourceTitle, utmTitle } from "@/lib/analytics/types";
import { applicationsFrom } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { nominationTitle } from "@/lib/dictionaries";
import { formatClock, formatDuration } from "@/lib/format";

type Props = PageProps<"/sessions/[id]">;

const SHOWN = 1000;

async function load(props: Props) {
  await requireUser();
  const id = Number((await props.params).id);
  return Number.isInteger(id) && id > 0 ? findVisit(id) : undefined;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const visit = await load(props);
  return { title: visit ? `Сессия № ${visit.id}` : "Сессия не найдена" };
}

export default async function SessionPage(props: Props) {
  const visit = await load(props);
  if (!visit) notFound();

  const visitor = findVisitor(visit.visitorId);
  const events = visitEvents(visit.id, SHOWN);
  const applications = applicationsFrom({ sessionId: visit.id });
  const others = listVisits({
    range: null,
    visitorId: visit.visitorId,
  }).items.filter((item) => item.id !== visit.id);

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h2 className="text-2xl leading-tight font-bold text-balance break-words text-ink md:text-4xl">
              {visit.utm ? utmTitle(visit.utm) : sourceTitle(visit.source)}
            </h2>
            <p className="mt-1.5 text-sm text-mute">
              Посетитель № {visit.visitorId} · начало{" "}
              {formatClock(visit.startedAt)} мск
            </p>
          </div>
          <ButtonLink href="/sessions" size="sm">
            <MdArrowBack aria-hidden className="size-[18px]" />
            Все сессии
          </ButtonLink>
        </div>
        <div className="mt-4">
          <VisitBadges visit={visit} />
        </div>
      </Panel>

      <section
        aria-label="Итоги сессии"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <Stat label="Просмотров страниц" value={visit.views} />
        <Stat label="Кликов" value={visit.clicks} />
        <Stat
          label="Время на сайте"
          value={formatDuration(visit.activeMs)}
          note="Пока вкладка была открыта и видна"
        />
        <Stat label="Всего событий" value={visit.events} />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Откуда и с чего">
            <dl className="grid gap-4 rounded-[1.25rem] bg-subtle p-5 sm:grid-cols-2 xl:grid-cols-3">
              <Fact label="Источник">{sourceTitle(visit.source)}</Fact>
              <Fact label="UTM-метка" className="sm:col-span-2">
                {visit.utm ? <UtmBadges utm={visit.utm} /> : "Без метки"}
              </Fact>
              <Fact label="Перешёл с">{visit.referrer || "—"}</Fact>
              <Fact label="Страница входа">{visit.landing}</Fact>
              <Fact label="Страница выхода">{visit.exit}</Fact>
              <Fact label="Устройство">
                {DEVICE_TITLES[visit.device] ?? visit.device}
              </Fact>
              <Fact label="Браузер и система">
                {visit.browser} · {visit.os}
              </Fact>
              <Fact label="Экран">{visit.screen || "—"}</Fact>
              <Fact label="Начало, мск">
                <span className="tabular-nums">
                  {formatClock(visit.startedAt)}
                </span>
              </Fact>
              <Fact label="Последнее действие, мск">
                <span className="tabular-nums">
                  {formatClock(visit.lastAt)}
                </span>
              </Fact>
            </dl>
          </Panel>

          <Panel
            title="Ход сессии"
            lead="Все действия посетителя по порядку"
            aside={
              <Pill>
                {visit.events > events.length
                  ? `Первые ${formatNumber(events.length)} из ${formatNumber(visit.events)}`
                  : `Событий: ${formatNumber(events.length)}`}
              </Pill>
            }
          >
            {events.length > 0 ? (
              <div className="-mx-[18px] overflow-x-auto md:-mx-6">
                <table className="w-full min-w-[40rem]">
                  <thead>
                    <tr>
                      <th className="th">Время, мск</th>
                      <th className="th">Событие</th>
                      <th className="th">Страница</th>
                      <th className="th">Детали</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="td whitespace-nowrap text-mute tabular-nums">
                          {formatClock(event.at).slice(-8)}
                        </td>
                        <td className="td">
                          <EventBadge type={event.type} />
                        </td>
                        <td className="td font-bold break-all text-ink">
                          {event.path}
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
                Событий этой сессии в логе уже нет: он хранит их ограниченное
                время.
              </Empty>
            )}
            {visit.events > events.length && (
              <p className="mt-4 text-sm text-mute">
                Сессия длинная — здесь её начало.{" "}
                <Link
                  href={`/logs?session=${visit.id}`}
                  className="font-bold text-accent underline-offset-4 hover:underline"
                >
                  Все события в логах
                </Link>
              </p>
            )}
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <Panel
            title="Заявки из этой сессии"
            lead={
              applications.length === 0
                ? "В этой сессии заявок не отправляли."
                : undefined
            }
          >
            {applications.length > 0 && (
              <ul className="flex flex-col gap-1">
                {applications.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/applications/${item.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-subtle"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">
                          № {item.id} · {item.name}
                        </span>
                        <span className="block truncate text-xs text-mute">
                          {nominationTitle(item.nomination)}
                        </span>
                      </span>
                      <StatusBadge status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title={`Посетитель № ${visit.visitorId}`}
            lead={
              visitor
                ? `Впервые на сайте ${formatClock(visitor.firstAt)} мск · заходов: ${formatNumber(visitor.visits)}${
                    visitor.source !== visit.source
                      ? ` · в первый раз пришёл из источника «${sourceTitle(visitor.source)}»`
                      : ""
                  }`
                : undefined
            }
            aside={
              others.length > 0 && (
                <ButtonLink
                  href={`/sessions?visitor=${visit.visitorId}`}
                  variant="soft"
                  size="xs"
                >
                  Все сессии
                </ButtonLink>
              )
            }
          >
            {others.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {others.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/sessions/${item.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-subtle"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">
                          Сессия № {item.id}
                        </span>
                        <span className="block truncate text-xs text-mute tabular-nums">
                          {formatClock(item.startedAt)} ·{" "}
                          {sourceTitle(item.source)}
                        </span>
                      </span>
                      <span className="text-xs font-bold whitespace-nowrap text-soft">
                        {item.views} стр.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mute">Других сессий у него не было.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
