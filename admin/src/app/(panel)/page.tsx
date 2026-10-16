import type { Metadata } from "next";
import Link from "next/link";
import { formatNumber, Panel, Stat } from "@/components/panel/Blocks";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { presetRange } from "@/lib/analytics/range";
import { onlineNow, totals } from "@/lib/analytics/report";
import { overview, recentActivity } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { NOMINATIONS, STATUSES, type Status } from "@/lib/dictionaries";
import { describeEvent } from "@/lib/events";
import { formatAge, plural } from "@/lib/format";
import { isAccepting } from "@/lib/settings";

export const metadata: Metadata = { title: "Обзор" };

const tones: Record<Status, string> = {
  moderation: "text-info",
  approved: "text-ok",
  rejected: "text-danger",
};

export default async function OverviewPage() {
  const user = await requireUser();
  const { byStatus, byNomination, participants, oldestWaiting, today, week } =
    overview();
  const activity = recentActivity(8);
  const total = STATUSES.reduce((sum, { id }) => sum + byStatus[id], 0);
  const site = totals(presetRange("today"));

  return (
    <div className="flex flex-col gap-5">
      {!isAccepting() && (
        <Notice tone="warning">
          Приём заявок закрыт: сайт не принимает новые заявки и правки.
          {user.role === "admin" && (
            <>
              {" "}
              <Link href="/settings" className="underline underline-offset-2">
                Открыть в настройках
              </Link>
            </>
          )}
        </Notice>
      )}

      <section
        aria-label="Заявки по статусам"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          href="/applications"
          label="Всего заявок"
          value={total}
          note={
            total === 0
              ? "Появятся, как только участники начнут их подавать"
              : `От ${plural(participants, "участника", "участников", "участников")} · сегодня ${today} · за 7 дней ${week}`
          }
        />
        <Stat
          href="/applications?status=moderation&sort=old"
          label="Ждут решения"
          value={byStatus.moderation}
          tone={tones.moderation}
          note={
            oldestWaiting
              ? `Самая давняя подана ${formatAge(oldestWaiting)}`
              : "Очередь пуста"
          }
        />
        <Stat
          href="/applications?status=approved"
          label="Принято"
          value={byStatus.approved}
          tone={tones.approved}
          note="Прошли модерацию"
        />
        <Stat
          href="/applications?status=rejected"
          label="Отклонено"
          value={byStatus.rejected}
          tone={tones.rejected}
          note="Участник может доработать и подать снова"
        />
      </section>

      <section
        aria-label="Сайт сегодня"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <Stat
          href="/statistics?range=today"
          label="Посетители сегодня"
          value={site.visitors}
          note={`Новых: ${formatNumber(site.new_visitors)}`}
        />
        <Stat
          href="/sessions"
          label="Сессии сегодня"
          value={site.visits}
          note={`Просмотров страниц: ${formatNumber(site.views)}`}
        />
        <Stat
          href="/statistics?range=today"
          label="Заявок с сайта сегодня"
          value={site.applications}
          note={`Начали заполнять анкету: ${formatNumber(site.form_start)}`}
        />
        <Stat
          href="/logs"
          label="Сейчас на сайте"
          value={onlineNow()}
          note="Были активны в последние 5 минут"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="По номинациям" className="overflow-hidden">
          <div className="-mx-[18px] overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[34rem]">
              <thead>
                <tr>
                  <th className="th">Номинация</th>
                  {STATUSES.map((status) => (
                    <th key={status.id} className="th text-right">
                      {status.title}
                    </th>
                  ))}
                  <th className="th text-right">Всего</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {NOMINATIONS.map((nomination) => {
                  const counts = byNomination.get(nomination.id);
                  const sum = STATUSES.reduce(
                    (value, { id }) => value + (counts?.[id] ?? 0),
                    0,
                  );
                  return (
                    <tr key={nomination.id}>
                      <td className="td font-bold whitespace-nowrap text-ink">
                        <Link
                          href={`/applications?nomination=${nomination.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {nomination.title}
                        </Link>
                      </td>
                      {STATUSES.map((status) => {
                        const count = counts?.[status.id] ?? 0;
                        return (
                          <td key={status.id} className="td text-right">
                            {count > 0 ? (
                              <Link
                                href={`/applications?nomination=${nomination.id}&status=${status.id}`}
                                className={`${tones[status.id]} font-bold underline-offset-4 hover:underline`}
                              >
                                {count}
                              </Link>
                            ) : (
                              <span className="text-mute">0</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="td text-right font-bold text-ink">
                        {sum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Последние события"
          aside={
            byStatus.moderation > 0 && (
              <ButtonLink
                href="/applications?status=moderation&sort=old"
                variant="soft"
                size="xs"
              >
                К очереди модерации
              </ButtonLink>
            )
          }
        >
          {activity.length === 0 ? (
            <p className="text-sm text-mute">Пока ничего не происходило.</p>
          ) : (
            <ul>
              {activity.map((event) => (
                <li
                  key={event.id}
                  className="border-t border-rule first:border-0"
                >
                  <Link
                    href={`/applications/${event.applicationId}`}
                    className="group block py-3"
                  >
                    <span className="block text-sm font-bold text-ink underline-offset-4 group-hover:underline">
                      {event.applicant}
                    </span>
                    <span className="mt-0.5 block text-sm text-mute">
                      {describeEvent(event).title}
                      {event.author && ` · ${event.author}`} ·{" "}
                      {formatAge(event.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
