import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MdFileDownload } from "react-icons/md";
import { Filters } from "@/components/applications/Filters";
import {
  Empty,
  Fact,
  formatNumber,
  Pager,
  Panel,
  Pill,
} from "@/components/panel/Blocks";
import { buttonClass } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { countByStatus, listApplications, PAGE_SIZE } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { kindTitle, nominationTitle, STATUSES } from "@/lib/dictionaries";
import { formatShortDateTime } from "@/lib/format";
import { listQuery, parseListParams } from "@/lib/list-params";

export const metadata: Metadata = { title: "Заявки" };

export default async function ApplicationsPage(
  props: PageProps<"/applications">,
) {
  await requireUser();
  const view = parseListParams(await props.searchParams);
  const { filter } = view;

  const counts = countByStatus(filter);
  const everything = STATUSES.reduce((sum, { id }) => sum + counts[id], 0);
  const { total, items } = listApplications(filter, view);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // A page past the end — the list shrank, or the address was typed by hand.
  if (view.page > pages) {
    redirect(`/applications${listQuery(view, { page: pages })}`);
  }
  const narrowed = Boolean(filter.nomination || filter.kind || filter.query);

  const tabs = [
    { id: undefined, title: "Все", count: everything },
    ...STATUSES.map((status) => ({ ...status, count: counts[status.id] })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Статус">
          <ul className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const current = filter.status === tab.id;
              return (
                <li key={tab.id ?? "all"}>
                  <Link
                    href={`/applications${listQuery(view, { filter: { ...filter, status: tab.id }, page: 1 })}`}
                    aria-current={current ? "page" : undefined}
                    className={buttonClass({
                      variant: current ? "primary" : "float",
                      size: "sm",
                      className: current ? "shadow-brand" : undefined,
                    })}
                  >
                    {tab.title}
                    <span className="font-medium opacity-70 tabular-nums">
                      {formatNumber(tab.count)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {total > 0 && (
          // A plain link: the browser downloads the file, there is no page to navigate to.
          <a
            href={`/applications/export${listQuery({ ...view, page: 1 })}`}
            className={buttonClass({ variant: "float", size: "sm" })}
            download
          >
            <MdFileDownload aria-hidden className="size-[18px]" />
            Скачать таблицу
          </a>
        )}
      </div>

      <Filters view={view} />

      <Panel
        title="База заявок"
        lead={
          <span aria-live="polite">
            {total === 0
              ? "Ничего не найдено"
              : `Найдено: ${formatNumber(total)}`}
            {narrowed && (
              <>
                {" · "}
                <Link
                  href={`/applications${listQuery({ filter: { status: filter.status }, sort: view.sort, page: 1 })}`}
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  Сбросить фильтры
                </Link>
              </>
            )}
          </span>
        }
        aside={
          <Pill>
            Страница {view.page} из {pages}
          </Pill>
        }
      >
        {items.length > 0 ? (
          <ul className="flex flex-col gap-3.5">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/applications/${item.id}`}
                  className={cn(
                    "card flex flex-col gap-3 border border-transparent p-3.5 transition-[transform,box-shadow,background-color] duration-200 md:gap-4 md:p-[22px] xl:flex-row xl:items-center xl:gap-[18px]",
                    "hover:-translate-y-px hover:bg-subtle hover:shadow-[0_20px_40px_rgb(112_144_176/0.16)] active:translate-y-0 dark:hover:shadow-none",
                  )}
                >
                  <div className="min-w-0 xl:w-60 xl:shrink-0">
                    <p className="truncate text-lg leading-tight font-bold text-ink md:text-xl">
                      {item.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-mute md:text-sm">
                      № {item.id} · {item.city}
                    </p>
                  </div>
                  <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3.5 gap-y-2.5 md:grid-cols-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_5.5rem_3.5rem_8.5rem]">
                    <Fact label="Номинация">
                      {nominationTitle(item.nomination)}
                    </Fact>
                    <Fact label="Сфера">{item.field}</Fact>
                    <Fact label="Тип">{kindTitle(item.kind)}</Fact>
                    <Fact label="Фото">{item.photoCount || "—"}</Fact>
                    <Fact label="Подана, мск">
                      <span className="tabular-nums">
                        {formatShortDateTime(item.createdAt)}
                      </span>
                    </Fact>
                  </dl>
                  <StatusBadge
                    status={item.status}
                    className="self-start xl:self-center"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            {everything === 0 && !narrowed
              ? "Заявок пока нет."
              : "Под эти условия не подходит ни одна заявка."}
          </Empty>
        )}

        <Pager
          note={`Порядок: ${view.sort === "old" ? "сначала старые" : "сначала новые"}`}
          previous={
            view.page > 1
              ? `/applications${listQuery(view, { page: view.page - 1 })}`
              : undefined
          }
          next={
            view.page < pages
              ? `/applications${listQuery(view, { page: view.page + 1 })}`
              : undefined
          }
        />
      </Panel>
    </div>
  );
}
