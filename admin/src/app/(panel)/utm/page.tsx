import type { Metadata } from "next";
import Link from "next/link";
import { UtmBadges } from "@/components/analytics/Marks";
import {
  Empty,
  formatNumber,
  Panel,
  Pill,
  Stat,
} from "@/components/panel/Blocks";
import { FilterBar } from "@/components/panel/FilterBar";
import { RangeBar } from "@/components/panel/RangeBar";
import { plain, withParams } from "@/lib/analytics/params";
import { parseRange } from "@/lib/analytics/range";
import { utmReport } from "@/lib/analytics/utm";
import { requireUser } from "@/lib/auth";
import { formatClock, formatShare } from "@/lib/format";
import { siteUrl } from "@/lib/mail";

export const metadata: Metadata = { title: "UTM" };

export default async function UtmPage(props: PageProps<"/utm">) {
  await requireUser();
  const params = plain(await props.searchParams);
  const range = parseRange(params, "all");
  const period = { range: params.range, from: params.from, to: params.to };
  const { items, summary } = utmReport(range, params.q ?? "");
  const site = siteUrl() ?? "https://адрес-сайта";

  return (
    <div className="flex flex-col gap-5">
      <RangeBar
        path="/utm"
        range={range}
        params={{ q: params.q }}
        updated={formatClock()}
      />

      <FilterBar
        path="/utm"
        params={params}
        search={{ name: "q", placeholder: "Поиск по utm" }}
      />

      <section
        aria-label="Итоги периода"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <Stat label="UTM-меток" value={summary.tags} />
        <Stat label="Сессий по меткам" value={summary.visits} />
        <Stat label="Новых посетителей" value={summary.newVisitors} />
        <Stat label="Заявок" value={summary.applications} />
      </section>

      <Panel
        title="Метки"
        lead="Каждая строка — своё сочетание utm-параметров в ссылке на сайт"
        aside={<Pill>Меток: {formatNumber(summary.tags)}</Pill>}
      >
        {items.length > 0 ? (
          <div className="-mx-[18px] overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[60rem]">
              <thead>
                <tr>
                  <th className="th">UTM</th>
                  <th className="th text-right">Сессии</th>
                  <th className="th text-right">Новые посетители</th>
                  <th className="th text-right">Повторные заходы</th>
                  <th className="th text-right">Начали анкету</th>
                  <th className="th text-right">Заявки</th>
                  <th className="th text-right">Конверсия</th>
                  <th className="th">Последний переход, мск</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="td">
                      <Link
                        href={withParams("/sessions", period, { utm: item.id })}
                        title="Сессии по этой метке"
                        className="block transition-opacity hover:opacity-75"
                      >
                        <UtmBadges utm={item} nowrap />
                      </Link>
                    </td>
                    <td className="td text-right font-bold text-ink">
                      {formatNumber(item.visits)}
                    </td>
                    <td className="td text-right font-bold text-ink">
                      {formatNumber(item.newVisitors)}
                    </td>
                    <td className="td text-right text-mute">
                      {formatNumber(item.visits - item.newVisitors)}
                    </td>
                    <td className="td text-right text-mute">
                      {formatNumber(item.formStarts)}
                    </td>
                    <td className="td text-right font-bold text-ink">
                      {formatNumber(item.applications)}
                    </td>
                    <td className="td text-right text-mute">
                      {formatShare(item.applications, item.visits)}
                    </td>
                    <td className="td whitespace-nowrap text-mute">
                      {formatClock(item.lastAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            {params.q
              ? "Меток с таким текстом за этот период нет."
              : "UTM-данных пока нет."}
          </Empty>
        )}
      </Panel>

      <Panel
        title="Как пометить ссылку"
        lead="Допишите к адресу сайта параметры — и переходы по этой ссылке появятся здесь отдельной строкой."
      >
        <p className="rounded-2xl bg-subtle px-4 py-3 font-mono text-sm break-all text-ink">
          {site}/?utm_source=
          <span className="text-accent">vk</span>&amp;utm_medium=
          <span className="text-accent">post</span>&amp;utm_campaign=
          <span className="text-accent">start</span>
        </p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-bold text-ink">utm_source</dt>
            <dd className="text-soft">Откуда: vk, telegram, yandex, avito.</dd>
          </div>
          <div>
            <dt className="font-bold text-ink">utm_medium</dt>
            <dd className="text-soft">Чем: post, banner, email, cpc.</dd>
          </div>
          <div>
            <dt className="font-bold text-ink">utm_campaign</dt>
            <dd className="text-soft">Какая кампания: start, final_week.</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-mute">
          Необязательные utm_content и utm_term помогают различать объявления
          внутри одной кампании. Регистр важен: «VK» и «vk» — две разные метки.
        </p>
      </Panel>
    </div>
  );
}
