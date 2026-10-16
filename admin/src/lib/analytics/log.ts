import "server-only";

import type { Range } from "@/lib/analytics/range";
import { addDays, stats } from "@/lib/analytics/store";
import {
  type EventType,
  isEventType,
  UTM_FIELDS,
  type Utm,
} from "@/lib/analytics/types";

/*
 * Reading the visit log: visits and the events inside them, newest first.
 *
 * The log can hold millions of rows, so nothing here counts them or walks
 * them end to end. A page is read by row number — "the fifty rows below this
 * one" — which costs the same on the first page and the ten-thousandth, and
 * totals come from the counters (report.ts).
 *
 * A filter the log has an index for (a visit's events, events of one type,
 * visits with an application…) is answered straight from that index. Any
 * other filter is checked row by row, and a rare match could mean reading the
 * whole log to fill a page; such a search works for a fraction of a second
 * and, if the page is still not full, says how far it got and offers to carry
 * on from there.
 */

export const PAGE = 50;

/** How long a filtered search may look before it reports back, ms. */
const PATIENCE = 150;
/** Rows it looks through between glances at the clock. */
const STEP = 50_000;

type Bounds = { from: number; before: number };

/** The row numbers a range of days covers (see `marks` in store.ts). */
function bounds(table: "events" | "sessions", range: Range | null): Bounds {
  // One past the newest row: the top of the log.
  const end =
    (stats.get<{ id: number | null }>(`SELECT MAX(id) AS id FROM ${table}`)
      ?.id ?? 0) + 1;
  if (!range) return { from: 0, before: end };

  const column = table === "events" ? "event_id" : "session_id";
  const edge = (day: string) =>
    stats.get<{ id: number }>(
      `SELECT ${column} AS id FROM marks WHERE day >= :day ORDER BY day LIMIT 1`,
      { day },
    )?.id;
  return {
    // No mark on or after a day: nothing has been recorded since it began.
    from: edge(range.from) ?? end,
    before: edge(addDays(range.to, 1)) ?? end,
  };
}

type Query = {
  /** `SELECT … FROM … [JOIN …]`, the scanned table aliased as `t`. */
  select: string;
  /** Conditions an index answers. */
  indexed: string[];
  /** Conditions that have to be checked row by row. */
  scanned: string[];
  params: Record<string, string | number>;
};

export type Page<Row> = {
  items: Row[];
  /** Pass as `before` to read on; `null` at the end of the log. */
  next: number | null;
  /** Set when a search stopped early: it has looked at everything above this row. */
  searchedTo: number | null;
};

function readPage<Row extends { id: number }>(
  query: Query,
  limits: Bounds,
  before: number | undefined,
): Page<Row> {
  const upper = Math.min(limits.before, before ?? limits.before);
  const sql = (extra: string[]) =>
    `${query.select}
     WHERE ${["t.id < :upper", "t.id >= :lower", ...query.indexed, ...extra].join(" AND ")}
     ORDER BY t.id DESC LIMIT :limit`;

  if (query.scanned.length === 0) {
    const items = stats.all<Row>(sql([]), {
      ...query.params,
      upper,
      lower: limits.from,
      limit: PAGE + 1,
    });
    const more = items.length > PAGE;
    if (more) items.pop();
    return {
      items,
      next: more ? items[items.length - 1].id : null,
      searchedTo: null,
    };
  }

  const items: Row[] = [];
  let edge = upper;
  const floor = limits.from;
  const started = performance.now();
  while (
    items.length < PAGE &&
    edge > floor &&
    performance.now() - started < PATIENCE
  ) {
    const lower = Math.max(floor, edge - STEP);
    items.push(
      ...stats.all<Row>(sql(query.scanned), {
        ...query.params,
        upper: edge,
        lower,
        limit: PAGE - items.length,
      }),
    );
    edge = lower;
  }

  if (items.length >= PAGE) {
    return { items, next: items[items.length - 1].id, searchedTo: null };
  }
  // Out of time, not out of log: there may be more further down.
  const unfinished = edge > Math.max(floor, 1);
  return {
    items,
    next: unfinished ? edge : null,
    searchedTo: unfinished ? edge : null,
  };
}

/* ---------- Visits ---------- */

export type Visit = {
  id: number;
  visitorId: number;
  startedAt: number;
  lastAt: number;
  isNew: boolean;
  source: string;
  utm: Utm | null;
  utmId: number | null;
  referrer: string;
  landing: string;
  exit: string;
  device: string;
  browser: string;
  os: string;
  screen: string;
  views: number;
  clicks: number;
  events: number;
  activeMs: number;
  funnel: number;
  applications: number;
  /** Heard from in the last five minutes. */
  online: boolean;
};

const ONLINE = 5 * 60 * 1000;

type VisitRow = {
  id: number;
  visitor_id: number;
  started_at: number;
  last_at: number;
  is_new: number;
  utm_id: number | null;
  source: string;
  referrer: string;
  landing: string;
  exit: string;
  device: string;
  browser: string;
  os: string;
  screen: string;
  views: number;
  clicks: number;
  events: number;
  active_ms: number;
  funnel: number;
  applications: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const VISITS = `
  SELECT t.*, utm.source AS utm_source, utm.medium AS utm_medium,
    utm.campaign AS utm_campaign, utm.content AS utm_content, utm.term AS utm_term
  FROM sessions AS t LEFT JOIN utm ON utm.id = t.utm_id`;

function toVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    visitorId: row.visitor_id,
    startedAt: row.started_at,
    lastAt: row.last_at,
    isNew: row.is_new === 1,
    source: row.source,
    utm:
      row.utm_id === null
        ? null
        : (Object.fromEntries(
            UTM_FIELDS.map((field) => [field, row[`utm_${field}`] ?? ""]),
          ) as Utm),
    utmId: row.utm_id,
    referrer: row.referrer,
    landing: row.landing,
    exit: row.exit,
    device: row.device,
    browser: row.browser,
    os: row.os,
    screen: row.screen,
    views: row.views,
    clicks: row.clicks,
    events: row.events,
    activeMs: row.active_ms,
    funnel: row.funnel,
    applications: row.applications,
    online: Date.now() - row.last_at < ONLINE,
  };
}

export type VisitFilter = {
  range: Range | null;
  /** Only visits that ended in an application. */
  applied?: boolean;
  visitorId?: number;
  utmId?: number;
  device?: string;
  source?: string;
};

export function listVisits(filter: VisitFilter, before?: number): Page<Visit> {
  const query: Query = { select: VISITS, indexed: [], scanned: [], params: {} };

  // One index per query: the first filter that has one takes it, the rest
  // are checked against the rows it returns.
  if (filter.visitorId !== undefined) {
    query.indexed.push("t.visitor_id = :visitor");
    query.params.visitor = filter.visitorId;
  } else if (filter.utmId !== undefined) {
    query.indexed.push("t.utm_id = :utm");
    query.params.utm = filter.utmId;
  }
  if (filter.applied) {
    query.indexed.push("t.applications > 0");
  }
  if (filter.device) {
    query.scanned.push("t.device = :device");
    query.params.device = filter.device;
  }
  if (filter.source !== undefined) {
    query.scanned.push("t.source = :source");
    query.params.source = filter.source;
  }
  // With a visitor or a tag picked, what is left to check is a short list.
  if (filter.visitorId !== undefined || filter.utmId !== undefined) {
    query.indexed.push(...query.scanned.splice(0));
  }

  const page = readPage<VisitRow>(
    query,
    bounds("sessions", filter.range),
    before,
  );
  return { ...page, items: page.items.map(toVisit) };
}

export function findVisit(id: number) {
  const row = stats.get<VisitRow>(`${VISITS} WHERE t.id = :id`, { id });
  return row && toVisit(row);
}

export type Visitor = {
  id: number;
  firstAt: number;
  lastAt: number;
  visits: number;
  /** What brought them the very first time. */
  source: string;
};

export function findVisitor(id: number): Visitor | undefined {
  const row = stats.get<{
    id: number;
    first_at: number;
    last_at: number;
    visits: number;
    source: string;
  }>(
    "SELECT id, first_at, last_at, visits, source FROM visitors WHERE id = :id",
    { id },
  );
  return (
    row && {
      id: row.id,
      firstAt: row.first_at,
      lastAt: row.last_at,
      visits: row.visits,
      source: row.source,
    }
  );
}

/* ---------- Events ---------- */

export type LogEvent = {
  id: number;
  sessionId: number;
  /** `null` when the visit itself has aged out of the log. */
  visitorId: number | null;
  at: number;
  type: EventType;
  path: string;
  label: string;
  target: string;
  value: number | null;
  source: string | null;
  device: string | null;
};

type EventRow = {
  id: number;
  session_id: number;
  visitor_id: number | null;
  at: number;
  type: string;
  path: string;
  label: string;
  target: string;
  value: number | null;
  source: string | null;
  device: string | null;
};

const EVENTS = `
  SELECT t.id, t.session_id, t.at, t.type, t.path, t.label, t.target, t.value,
    sessions.visitor_id, sessions.source, sessions.device
  FROM events AS t LEFT JOIN sessions ON sessions.id = t.session_id`;

function toEvent(row: EventRow): LogEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    visitorId: row.visitor_id,
    at: row.at,
    type: isEventType(row.type) ? row.type : "view",
    path: row.path,
    label: row.label,
    target: row.target,
    value: row.value,
    source: row.source,
    device: row.device,
  };
}

export type EventFilter = {
  range: Range | null;
  type?: EventType;
  sessionId?: number;
  visitorId?: number;
  /** Words to look for in the page address, the label or the link. */
  query?: string;
};

export function listEvents(
  filter: EventFilter,
  before?: number,
): Page<LogEvent> {
  const query: Query = { select: EVENTS, indexed: [], scanned: [], params: {} };

  const narrow =
    filter.sessionId !== undefined || filter.visitorId !== undefined;
  if (filter.sessionId !== undefined) {
    query.indexed.push("t.session_id = :session");
    query.params.session = filter.sessionId;
  } else if (filter.visitorId !== undefined) {
    query.indexed.push(
      "t.session_id IN (SELECT id FROM sessions WHERE visitor_id = :visitor)",
    );
    query.params.visitor = filter.visitorId;
  }
  if (filter.type) {
    query.indexed.push("t.type = :type");
    query.params.type = filter.type;
  }

  const words = (filter.query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  words.forEach((word, index) => {
    // lower() folds Latin only; Cyrillic is matched as typed and capitalised.
    (narrow ? query.indexed : query.scanned).push(
      `(t.path LIKE :word${index} ESCAPE '\\'
        OR t.label LIKE :word${index} ESCAPE '\\'
        OR t.label LIKE :title${index} ESCAPE '\\'
        OR t.target LIKE :word${index} ESCAPE '\\')`,
    );
    const escaped = word.replace(/[\\%_]/g, "\\$&");
    query.params[`word${index}`] = `%${escaped}%`;
    query.params[`title${index}`] =
      `%${escaped.charAt(0).toUpperCase()}${escaped.slice(1)}%`;
  });

  const page = readPage<EventRow>(
    query,
    bounds("events", filter.range),
    before,
  );
  return { ...page, items: page.items.map(toEvent) };
}

/** A visit's events in the order they happened. Long visits are cut at `limit`. */
export function visitEvents(sessionId: number, limit = 1000): LogEvent[] {
  return stats
    .all<EventRow>(
      `${EVENTS} WHERE t.session_id = :session ORDER BY t.id LIMIT :limit`,
      { session: sessionId, limit },
    )
    .map(toEvent);
}
