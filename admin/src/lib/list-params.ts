import type { Filter } from "@/lib/applications";
import { KINDS, NOMINATIONS, STATUSES, type Status } from "@/lib/dictionaries";

type RawParams = Record<string, string | string[] | undefined>;

export type ListView = {
  filter: Filter;
  sort: "new" | "old";
  page: number;
};

function single(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function known<Id extends string>(list: readonly { id: Id }[], value: string) {
  return list.find((item) => item.id === value)?.id;
}

/** Reads the applications list's state from the address bar, ignoring anything unexpected. */
export function parseListParams(raw: RawParams): ListView {
  const page = Number.parseInt(single(raw.page), 10);
  return {
    filter: {
      status: known<Status>(STATUSES, single(raw.status)),
      nomination: known(NOMINATIONS, single(raw.nomination)),
      kind: known(KINDS, single(raw.kind)),
      query: single(raw.q).slice(0, 200) || undefined,
    },
    sort: single(raw.sort) === "old" ? "old" : "new",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** The query string for a view; defaults are left out to keep addresses short. */
export function listQuery(view: ListView, change: Partial<ListView> = {}) {
  const next = { ...view, ...change };
  const params = new URLSearchParams();
  if (next.filter.status) params.set("status", next.filter.status);
  if (next.filter.nomination) params.set("nomination", next.filter.nomination);
  if (next.filter.kind) params.set("kind", next.filter.kind);
  if (next.filter.query) params.set("q", next.filter.query);
  if (next.sort === "old") params.set("sort", "old");
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
