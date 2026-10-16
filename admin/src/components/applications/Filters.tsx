"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdSearch } from "react-icons/md";
import { KINDS, NOMINATIONS } from "@/lib/dictionaries";
import { listQuery, type ListView } from "@/lib/list-params";

function draftOf(view: ListView) {
  return {
    query: view.filter.query ?? "",
    nomination: view.filter.nomination ?? "",
    kind: view.filter.kind ?? "",
    sort: view.sort,
  };
}

/**
 * Search box and filters of the applications list. The address bar is the
 * source of truth: the fields mirror it, and every change navigates.
 */
export function Filters({ view }: { view: ListView }) {
  const router = useRouter();

  // Follow the address when it changes from outside (a tab, "reset", Back).
  const address = listQuery(view);
  const [seen, setSeen] = useState(address);
  const [draft, setDraft] = useState(() => draftOf(view));
  if (seen !== address) {
    setSeen(address);
    setDraft(draftOf(view));
  }

  const apply = (next: typeof draft) => {
    setDraft(next);
    router.push(
      `/applications${listQuery({
        filter: {
          status: view.filter.status,
          nomination: next.nomination || undefined,
          kind: next.kind || undefined,
          query: next.query.trim() || undefined,
        },
        sort: next.sort,
        page: 1,
      })}`,
    );
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        apply(draft);
      }}
      className="card flex flex-wrap gap-3 p-6 lg:flex-nowrap lg:gap-5"
    >
      <label className="relative min-w-0 flex-[1_1_100%] lg:flex-[1.4_1_0]">
        <MdSearch
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-nav"
        />
        <input
          type="search"
          value={draft.query}
          onChange={(event) =>
            setDraft({ ...draft, query: event.target.value })
          }
          placeholder="Имя, почта, телефон, город, № заявки"
          aria-label="Поиск по заявкам"
          className="filter pl-11"
        />
      </label>
      <select
        value={draft.nomination}
        onChange={(event) =>
          apply({ ...draft, nomination: event.target.value })
        }
        aria-label="Номинация"
        className="filter flex-[1_1_100%] sm:flex-[1_1_0] lg:flex-[0_0_15rem]"
      >
        <option value="">Все номинации</option>
        {NOMINATIONS.map((nomination) => (
          <option key={nomination.id} value={nomination.id}>
            {nomination.title}
          </option>
        ))}
      </select>
      <select
        value={draft.kind}
        onChange={(event) => apply({ ...draft, kind: event.target.value })}
        aria-label="Тип участника"
        className="filter flex-[1_1_100%] sm:flex-[1_1_0] lg:flex-[0_0_10rem]"
      >
        <option value="">Все типы</option>
        {KINDS.map((kind) => (
          <option key={kind.id} value={kind.id}>
            {kind.title}
          </option>
        ))}
      </select>
      <select
        value={draft.sort}
        onChange={(event) =>
          apply({
            ...draft,
            sort: event.target.value === "old" ? "old" : "new",
          })
        }
        aria-label="Порядок"
        className="filter flex-[1_1_100%] sm:flex-[1_1_0] lg:flex-[0_0_12rem]"
      >
        <option value="new">Сначала новые</option>
        <option value="old">Сначала старые</option>
      </select>
    </form>
  );
}
