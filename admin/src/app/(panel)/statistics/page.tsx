import type { Metadata } from "next";
import Link from "next/link";
import {
  Empty,
  formatNumber,
  Highlight,
  Panel,
  Pill,
  Rows,
} from "@/components/panel/Blocks";
import { ChartCard } from "@/components/panel/ChartCard";
import { RangeBar } from "@/components/panel/RangeBar";
import { plain, withParams } from "@/lib/analytics/params";
import { parseRange } from "@/lib/analytics/range";
import { onlineNow, series, top, totals } from "@/lib/analytics/report";
import { DEVICE_TITLES, sourceTitle } from "@/lib/analytics/types";
import { requireUser } from "@/lib/auth";
import { formatClock, formatDuration, formatShare } from "@/lib/format";

export const metadata: Metadata = { title: "Статистика" };

export default async function StatisticsPage(props: PageProps<"/statistics">) {
  await requireUser();
  const params = plain(await props.searchParams);
  const range = parseRange(params);
  const period = { range: params.range, from: params.from, to: params.to };

  const sums = totals(range);
  const data = series(range);
  const step = data.hourly ? "по часам, мск" : "по дням";

  const sources = top("source", range, 8);
  const devices = top("device", range, 5);
  const browsers = top("browser", range, 6);
  const pages = top("page", range, 8);
  const landings = top("landing", range, 8);
  const clicks = top("click", range, 20);

  const share = (part: number) => `${formatShare(part, sums.visits)} сессий`;

  return (
    <div className="flex flex-col gap-5">
      <RangeBar path="/statistics" range={range} updated={formatClock()} />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Посетители"
          lead={`Уникальные посетители сайта, ${step}`}
          total={sums.visitors}
          kind="line"
          labels={data.labels}
          values={data.values.visitors}
        />
        <ChartCard
          title="Сессии"
          lead={`Сколько раз заходили на сайт, ${step}`}
          total={sums.visits}
          kind="bar"
          labels={data.labels}
          values={data.values.visits}
        />
        <ChartCard
          title="Просмотры страниц"
          lead={`Сколько страниц открыли, ${step}`}
          total={sums.views}
          kind="line"
          labels={data.labels}
          values={data.values.views}
        />
        <ChartCard
          title="Заявки"
          lead={`Отправленные с сайта заявки, ${step}`}
          total={sums.applications}
          kind="bar"
          tone="green"
          labels={data.labels}
          values={data.values.applications}
        />
        <ChartCard
          title="Новые посетители"
          lead={`Пришли на сайт впервые, ${step}`}
          total={sums.new_visitors}
          kind="line"
          labels={data.labels}
          values={data.values.new_visitors}
        />
        <Rows
          title="Воронка анкеты"
          rows={[
            {
              key: "open",
              label: "Открыли страницу анкеты",
              note: share(sums.form_open),
              value: formatNumber(sums.form_open),
            },
            {
              key: "start",
              label: "Начали заполнять",
              note: `${formatShare(sums.form_start, sums.form_open)} открывших`,
              value: formatNumber(sums.form_start),
            },
            {
              key: "submit",
              label: "Нажали «Отправить»",
              note: `${formatShare(sums.form_submit, sums.form_start)} начавших`,
              value: formatNumber(sums.form_submit),
            },
            {
              key: "sent",
              label: "Отправили заявку",
              note: `${formatShare(sums.form_sent, sums.form_submit)} нажавших`,
              value: formatNumber(sums.form_sent),
            },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Highlight
          label="Сейчас на сайте"
          note="Были активны в последние 5 минут"
          value={formatNumber(onlineNow())}
        />
        <Highlight
          label="Конверсия в заявку"
          note="Доля сессий, в которых отправили заявку"
          value={formatShare(sums.form_sent, sums.visits)}
        />
        <Highlight
          label="Отказы"
          note="Ушли, открыв одну страницу и ничего не нажав"
          value={formatShare(sums.visits - sums.engaged, sums.visits)}
        />
        <Highlight
          label="Глубина просмотра"
          note="Страниц за одну сессию"
          value={
            sums.visits > 0
              ? (sums.views / sums.visits).toLocaleString("ru-RU", {
                  maximumFractionDigits: 1,
                })
              : "—"
          }
        />
        <Highlight
          label="Среднее время на сайте"
          note="Пока вкладка с сайтом открыта и видна"
          value={
            sums.visits > 0 ? formatDuration(sums.active_ms / sums.visits) : "—"
          }
        />
        <Highlight
          label="Клики"
          note="По кнопкам и ссылкам сайта"
          value={formatNumber(sums.clicks)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Rows
          title="Источники"
          empty="За этот период заходов не было."
          rows={sources.map((row) => ({
            key: row.key,
            label: (
              <Link
                href={withParams("/sessions", period, {
                  source: row.key || "-",
                })}
                className="underline-offset-4 hover:underline"
              >
                {sourceTitle(row.key)}
              </Link>
            ),
            note: share(row.value),
            value: formatNumber(row.value),
          }))}
        />
        <Rows
          title="Устройства"
          empty="За этот период заходов не было."
          rows={devices.map((row) => ({
            key: row.key,
            label: (
              <Link
                href={withParams("/sessions", period, { device: row.key })}
                className="underline-offset-4 hover:underline"
              >
                {DEVICE_TITLES[row.key] ?? row.key}
              </Link>
            ),
            note: share(row.value),
            value: formatNumber(row.value),
          }))}
        />
        <Rows
          title="Браузеры"
          empty="За этот период заходов не было."
          rows={browsers.map((row) => ({
            key: row.key,
            label: row.key,
            note: share(row.value),
            value: formatNumber(row.value),
          }))}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Rows
          title="Страницы"
          empty="За этот период страницы не открывали."
          rows={pages.map((row) => ({
            key: row.key,
            label: row.key,
            note: `${formatShare(row.value, sums.views)} просмотров`,
            value: formatNumber(row.value),
          }))}
        />
        <Rows
          title="Страницы входа"
          empty="За этот период заходов не было."
          rows={landings.map((row) => ({
            key: row.key,
            label: row.key,
            note: share(row.value),
            value: formatNumber(row.value),
          }))}
        />
      </div>

      <Panel
        title="Что нажимают"
        lead="Кнопки и ссылки сайта, по которым кликали чаще всего"
        aside={<Pill>Всего кликов: {formatNumber(sums.clicks)}</Pill>}
      >
        {clicks.length > 0 ? (
          <div className="-mx-[18px] overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[36rem]">
              <thead>
                <tr>
                  <th className="th">Элемент</th>
                  <th className="th">Куда ведёт</th>
                  <th className="th text-right">Клики</th>
                  <th className="th text-right">Доля</th>
                </tr>
              </thead>
              <tbody>
                {clicks.map((row) => {
                  const [label, target] = row.key.split("\t");
                  return (
                    <tr key={row.key}>
                      <td className="td font-bold text-ink">
                        <Link
                          href={withParams("/logs", period, {
                            type: "click",
                            q: label,
                          })}
                          className="underline-offset-4 hover:underline"
                        >
                          {label}
                        </Link>
                      </td>
                      <td className="td break-all text-mute">
                        {target || "—"}
                      </td>
                      <td className="td text-right font-bold text-ink tabular-nums">
                        {formatNumber(row.value)}
                      </td>
                      <td className="td text-right text-mute tabular-nums">
                        {formatShare(row.value, sums.clicks)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>За этот период по сайту не кликали.</Empty>
        )}
      </Panel>
    </div>
  );
}
