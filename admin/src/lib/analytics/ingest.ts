import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { Agent } from "@/lib/analytics/agent";
import { addDays, dayOf, hourOf, stats } from "@/lib/analytics/store";
import {
  CLIENT_EVENTS,
  type EventType,
  FORM_PATH,
  type Origin,
  SESSION_GAP,
  UTM_FIELDS,
  type Utm,
} from "@/lib/analytics/types";

/*
 * Writing the visit log. The site sends what a visitor did in small batches
 * (frontend/src/lib/analytics.ts); each batch becomes one transaction that
 * appends to the log and moves the counters the reports are read from.
 *
 * Everything in a batch comes from a stranger's browser. It is cut to size
 * here, and whatever can take many different values — pages, button labels,
 * sources, UTM tags — has a ceiling on how many it may add, so nobody can
 * grow the counters without bound by inventing names.
 */

/* ---------- What the site sends ---------- */

type BatchEvent = {
  type: (typeof CLIENT_EVENTS)[number];
  path: string;
  /** How long before the batch was sent this happened, ms. */
  ago: number;
  label: string;
  target: string;
  value: number | null;
};

export type Batch = {
  /** Sent once per page load: how the visitor got here. */
  entry: { referrer: string; utm: Utm | null; screen: string } | null;
  events: BatchEvent[];
};

const MAX_EVENTS = 50;
const MAX_AGO = 10 * 60 * 1000;
const MAX_STAY = 30 * 60 * 1000;

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** A page of the site: no query, no fragment, no trailing slash. */
function pagePath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const path = value
    .replace(/[?#].*$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/(.)\/$/, "$1");
  return /^[\w\-./~%]{1,120}$/.test(path) ? path : null;
}

function whole(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : null;
}

/** Host and path of the page the visitor came from; the query is not ours to keep. */
function referrer(value: unknown) {
  if (typeof value !== "string" || !URL.canParse(value)) return "";
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  return text(
    url.host.replace(/^www\./, "") + url.pathname.replace(/\/$/, ""),
    160,
  );
}

function utm(value: unknown): Utm | null {
  if (typeof value !== "object" || value === null) return null;
  const tags = Object.fromEntries(
    UTM_FIELDS.map((field) => [
      field,
      text((value as Record<string, unknown>)[field], 80),
    ]),
  ) as Utm;
  return UTM_FIELDS.some((field) => tags[field]) ? tags : null;
}

/** Cuts a request body down to a batch. `null` if there is nothing usable in it. */
export function parseBatch(body: unknown): Batch | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as { entry?: unknown; events?: unknown };
  if (!Array.isArray(raw.events)) return null;

  const events: BatchEvent[] = [];
  for (const item of raw.events.slice(0, MAX_EVENTS) as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const event = item as Record<string, unknown>;
    const type = CLIENT_EVENTS.find((name) => name === event.type);
    const path = pagePath(event.path);
    if (!type || !path) continue;

    events.push({
      type,
      path,
      ago: whole(event.ago, 0, MAX_AGO) ?? 0,
      label: text(event.label, 80),
      target: text(event.target, 160),
      value:
        type === "scroll"
          ? whole(event.value, 0, 100)
          : type === "leave"
            ? whole(event.value, 0, MAX_STAY)
            : null,
    });
  }
  if (events.length === 0) return null;

  const entry =
    typeof raw.entry === "object" && raw.entry !== null
      ? (raw.entry as Record<string, unknown>)
      : null;
  return {
    entry: entry && {
      referrer: referrer(entry.referrer),
      utm: utm(entry.utm),
      screen: /^\d{2,5}x\d{2,5}$/.test(String(entry.screen))
        ? String(entry.screen)
        : "",
    },
    events,
  };
}

/* ---------- The visitor's cookie ---------- */

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/* ---------- Counters ---------- */

/** Increments gathered while a batch is processed and written in one go. */
class Tally {
  private daily = new Map<string, number>();
  private hourly = new Map<string, number>();
  private by = new Map<string, number>();
  readonly utm = {
    visits: 0,
    newVisitors: 0,
    views: 0,
    formStarts: 0,
    applications: 0,
  };

  constructor(
    private day: string,
    private hour: number,
  ) {}

  /** `byHour` for the handful of numbers today's chart is drawn from. */
  add(metric: string, value = 1, byHour = false) {
    this.daily.set(metric, (this.daily.get(metric) ?? 0) + value);
    if (byHour) this.hourly.set(metric, (this.hourly.get(metric) ?? 0) + value);
  }

  /** A broken-down counter; at most `max` different keys a day, the rest pooled. */
  addBy(metric: string, key: string, max: number, value = 1) {
    const name = `${metric}\n${withinLimit(metric, this.day, key, max)}`;
    this.by.set(name, (this.by.get(name) ?? 0) + value);
  }

  write(utmId: number | null) {
    for (const [metric, value] of this.daily) {
      stats.run(
        `INSERT INTO daily (day, metric, value) VALUES (:day, :metric, :value)
         ON CONFLICT (day, metric) DO UPDATE SET value = value + excluded.value`,
        { day: this.day, metric, value },
      );
    }
    for (const [metric, value] of this.hourly) {
      stats.run(
        `INSERT INTO hourly (day, hour, metric, value) VALUES (:day, :hour, :metric, :value)
         ON CONFLICT (day, hour, metric) DO UPDATE SET value = value + excluded.value`,
        { day: this.day, hour: this.hour, metric, value },
      );
    }
    for (const [name, value] of this.by) {
      const [metric, key] = name.split("\n");
      stats.run(
        `INSERT INTO daily_by (metric, day, key, value) VALUES (:metric, :day, :key, :value)
         ON CONFLICT (metric, day, key) DO UPDATE SET value = value + excluded.value`,
        { metric, day: this.day, key, value },
      );
    }

    const { visits, newVisitors, views, formStarts, applications } = this.utm;
    if (
      utmId !== null &&
      visits + newVisitors + views + formStarts + applications > 0
    ) {
      stats.run(
        `INSERT INTO utm_daily (day, utm_id, visits, new_visitors, views, form_starts, applications)
         VALUES (:day, :utmId, :visits, :newVisitors, :views, :formStarts, :applications)
         ON CONFLICT (day, utm_id) DO UPDATE SET
           visits = visits + excluded.visits,
           new_visitors = new_visitors + excluded.new_visitors,
           views = views + excluded.views,
           form_starts = form_starts + excluded.form_starts,
           applications = applications + excluded.applications`,
        {
          day: this.day,
          utmId,
          visits,
          newVisitors,
          views,
          formStarts,
          applications,
        },
      );
    }
  }
}

/** Everything past a breakdown's daily ceiling is counted under this name. */
export const OTHER = "(другое)";

const holder = globalThis as {
  __znakStatsMemory?: {
    /** Keys each breakdown has taken today. */
    keys: Map<string, Set<string>>;
    keysDay: string;
    /** The day `marks` was last written for. */
    marked: string;
    /** When each visitor was last heard from — "on the site right now". */
    online: Map<number, number>;
    prunedAt: number;
  };
};
const memory = (holder.__znakStatsMemory ??= {
  keys: new Map(),
  keysDay: "",
  marked: "",
  online: new Map(),
  prunedAt: 0,
});

function withinLimit(metric: string, day: string, key: string, max: number) {
  if (memory.keysDay !== day) {
    memory.keys.clear();
    memory.keysDay = day;
  }
  let seen = memory.keys.get(metric);
  if (!seen) {
    // After a restart: what the day has already counted under this metric.
    seen = new Set(
      stats
        .all<{ key: string }>(
          "SELECT key FROM daily_by WHERE metric = :metric AND day = :day",
          { metric, day },
        )
        .map((row) => row.key),
    );
    memory.keys.set(metric, seen);
  }
  if (seen.has(key)) return key;
  if (seen.size >= max) return OTHER;
  seen.add(key);
  return key;
}

// How many different values a breakdown may collect in a day.
const LIMITS = { page: 300, source: 500, click: 1000, agent: 50 };
const MAX_UTM_TAGS = 5000;

/* ---------- Visits ---------- */

type Visitor = {
  id: number;
  last_day: string;
  visits: number;
};

type Session = {
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
  views: number;
  clicks: number;
  events: number;
  active_ms: number;
  engaged: number;
  funnel: number;
  applications: number;
};

const FUNNEL_METRICS = [
  "",
  "form_open",
  "form_start",
  "form_submit",
  "form_sent",
];

/** Moves the visit up the application funnel, counting each step it passes. */
function raise(session: Session, level: number, tally: Tally) {
  for (let step = session.funnel + 1; step <= level; step++) {
    tally.add(FUNNEL_METRICS[step]);
    if (step === 2) tally.utm.formStarts += 1;
  }
  session.funnel = Math.max(session.funnel, level);
}

const POOLED: Utm = {
  source: OTHER,
  medium: "",
  campaign: "",
  content: "",
  term: "",
};

function findUtm(tags: Utm) {
  return stats.get<{ id: number }>(
    `SELECT id FROM utm WHERE source = :source AND medium = :medium
       AND campaign = :campaign AND content = :content AND term = :term`,
    tags,
  )?.id;
}

/** The row of this combination of tags, added on first sight. */
function utmId(tags: Utm, time: number): number {
  const known = findUtm(tags);
  if (known !== undefined) {
    stats.run("UPDATE utm SET last_at = :time WHERE id = :id", {
      id: known,
      time,
    });
    return known;
  }

  // Past the ceiling new combinations are pooled rather than added.
  const { total } = stats.get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM utm",
  )!;
  if (total >= MAX_UTM_TAGS && tags !== POOLED) return utmId(POOLED, time);

  return stats.run(
    `INSERT INTO utm (source, medium, campaign, content, term, first_at, last_at)
     VALUES (:source, :medium, :campaign, :content, :term, :time, :time)`,
    { ...tags, time },
  ).lastId;
}

function sameTags(id: number | null, tags: Utm) {
  if (id === null) return false;
  const row = stats.get<Utm>(
    "SELECT source, medium, campaign, content, term FROM utm WHERE id = :id",
    { id },
  );
  return row !== undefined && UTM_FIELDS.every((f) => row[f] === tags[f]);
}

/** Remembers where today's rows begin (see `marks` in store.ts). */
function mark(day: string) {
  if (memory.marked === day) return;
  stats.run(
    `INSERT OR IGNORE INTO marks (day, event_id, session_id) VALUES (
       :day,
       (SELECT COALESCE(MAX(id), 0) + 1 FROM events),
       (SELECT COALESCE(MAX(id), 0) + 1 FROM sessions)
     )`,
    { day },
  );
  memory.marked = day;
}

function saveSession(session: Session) {
  stats.run(
    `UPDATE sessions SET
       last_at = :last_at, exit = :exit, views = :views, clicks = :clicks, events = :events,
       active_ms = :active_ms, engaged = :engaged, funnel = :funnel, applications = :applications
     WHERE id = :id`,
    {
      id: session.id,
      last_at: session.last_at,
      exit: session.exit,
      views: session.views,
      clicks: session.clicks,
      events: session.events,
      active_ms: session.active_ms,
      engaged: session.engaged,
      funnel: session.funnel,
      applications: session.applications,
    },
  );
}

function insertEvent(
  session: Session,
  event: {
    at: number;
    type: EventType;
    path: string;
    label?: string;
    target?: string;
    value?: number | null;
  },
) {
  stats.run(
    `INSERT INTO events (session_id, at, type, path, label, target, value)
     VALUES (:session, :at, :type, :path, :label, :target, :value)`,
    {
      session: session.id,
      at: event.at,
      type: event.type,
      path: event.path,
      label: event.label ?? "",
      target: event.target ?? "",
      value: event.value ?? null,
    },
  );
  session.events += 1;
}

/**
 * Records one batch. `token` is the visitor's cookie, if they have one;
 * `mayCreate` is asked before a newcomer is registered (the route rations
 * that per address).
 *
 * Returns the cookie to hand out when the visitor is new, `null` otherwise.
 */
export function ingest(
  batch: Batch,
  who: { token: string | null; agent: Agent; mayCreate: () => boolean },
): { cookie: string | null } {
  const time = Date.now();
  const day = dayOf(time);
  const tally = new Tally(day, hourOf(time));

  return stats.transaction(() => {
    mark(day);

    /* Who */
    let visitor = who.token
      ? stats.get<Visitor>(
          "SELECT id, last_day, visits FROM visitors WHERE token = :token",
          { token: hashToken(who.token) },
        )
      : undefined;
    let cookie: string | null = null;
    const newcomer = !visitor;
    if (!visitor) {
      if (!who.mayCreate()) return { cookie: null };
      cookie = randomBytes(24).toString("base64url");
      const { lastId } = stats.run(
        "INSERT INTO visitors (token, first_at, last_at) VALUES (:token, :time, :time)",
        { token: hashToken(cookie), time },
      );
      visitor = { id: lastId, last_day: "", visits: 0 };
    }

    /* Which visit */
    let session = stats.get<Session>(
      "SELECT * FROM sessions WHERE visitor_id = :id ORDER BY id DESC LIMIT 1",
      { id: visitor.id },
    );
    const tags = batch.entry?.utm ?? null;
    // A click on another campaign's link starts a new visit even mid-browse.
    const campaignChanged =
      tags !== null && session && !sameTags(session.utm_id, tags);
    if (!session || time - session.last_at > SESSION_GAP || campaignChanged) {
      const first = batch.events[0];
      const tag = tags && utmId(tags, time);
      const from = batch.entry?.referrer ?? "";
      const source = tags?.source || from.split("/")[0] || "";
      const startedAt = time - first.ago;

      const { lastId } = stats.run(
        `INSERT INTO sessions (
           visitor_id, started_at, last_at, is_new, utm_id, source, referrer,
           landing, exit, device, browser, os, screen
         ) VALUES (
           :visitor, :startedAt, :time, :isNew, :utm, :source, :referrer,
           :landing, :landing, :device, :browser, :os, :screen
         )`,
        {
          visitor: visitor.id,
          startedAt,
          time,
          isNew: newcomer ? 1 : 0,
          utm: tag,
          source,
          referrer: from,
          landing: first.path,
          device: who.agent.device,
          browser: who.agent.browser,
          os: who.agent.os,
          screen: batch.entry?.screen ?? "",
        },
      );
      session = {
        id: lastId,
        visitor_id: visitor.id,
        started_at: startedAt,
        last_at: time,
        is_new: newcomer ? 1 : 0,
        utm_id: tag,
        source,
        referrer: from,
        landing: first.path,
        exit: first.path,
        device: who.agent.device,
        browser: who.agent.browser,
        os: who.agent.os,
        views: 0,
        clicks: 0,
        events: 0,
        active_ms: 0,
        engaged: 0,
        funnel: 0,
        applications: 0,
      };

      tally.add("visits", 1, true);
      tally.utm.visits += 1;
      tally.addBy("source", source, LIMITS.source);
      tally.addBy("landing", first.path, LIMITS.page);
      tally.addBy("device", who.agent.device, LIMITS.agent);
      tally.addBy("browser", who.agent.browser, LIMITS.agent);
      tally.addBy("os", who.agent.os, LIMITS.agent);
      if (newcomer) {
        tally.add("new_visitors", 1, true);
        tally.utm.newVisitors += 1;
        stats.run(
          "UPDATE visitors SET utm_id = :utm, source = :source WHERE id = :id",
          { id: visitor.id, utm: tag, source },
        );
      }
      visitor.visits += 1;
    }

    /* The day's first sign of this visitor */
    if (visitor.last_day !== day) {
      tally.add("visitors", 1, true);
      tally.addBy("uniq", visitor.last_day, Infinity);
    }

    /* What they did */
    for (const event of batch.events) {
      insertEvent(session, { ...event, at: time - event.ago });
      tally.add("events");
      tally.addBy("type", event.type, LIMITS.agent);

      switch (event.type) {
        case "view":
          session.views += 1;
          session.exit = event.path;
          tally.add("views", 1, true);
          tally.utm.views += 1;
          tally.addBy("page", event.path, LIMITS.page);
          if (event.path === FORM_PATH) raise(session, 1, tally);
          break;
        case "click":
          session.clicks += 1;
          tally.add("clicks");
          tally.addBy(
            "click",
            `${event.label || "(без подписи)"}\t${event.target}`,
            LIMITS.click,
          );
          break;
        case "leave":
          if (event.value) {
            session.active_ms += event.value;
            tally.add("active_ms", event.value);
          }
          break;
        case "form_start":
          raise(session, 2, tally);
          break;
        case "form_submit":
          raise(session, 3, tally);
          break;
      }

      const beyondOnePage =
        session.views > 1 ||
        event.type === "click" ||
        event.type.startsWith("form_");
      if (!session.engaged && beyondOnePage) {
        session.engaged = 1;
        tally.add("engaged");
      }
    }

    session.last_at = time;
    saveSession(session);
    stats.run(
      "UPDATE visitors SET last_at = :time, last_day = :day, visits = :visits WHERE id = :id",
      { id: visitor.id, time, day, visits: visitor.visits },
    );
    tally.write(session.utm_id);

    memory.online.set(visitor.id, time);
    return { cookie };
  });
}

/**
 * Ties a freshly saved application to the visit it was sent in and counts it.
 * Returns where the applicant came from, or `null` when the browser carries no
 * visitor cookie (the site's script was blocked).
 */
export function recordApplication(
  token: string | null,
  application: { id: number; nomination: string },
): Origin | null {
  if (!token) return null;
  const time = Date.now();
  const day = dayOf(time);
  const tally = new Tally(day, hourOf(time));

  return stats.transaction(() => {
    const visitor = stats.get<Visitor>(
      "SELECT id, last_day, visits FROM visitors WHERE token = :token",
      { token: hashToken(token) },
    );
    // The form can stay open for an hour while a story is written; the visit
    // it was opened in is still the one the application belongs to.
    const session =
      visitor &&
      stats.get<Session>(
        "SELECT * FROM sessions WHERE visitor_id = :id ORDER BY id DESC LIMIT 1",
        { id: visitor.id },
      );
    if (!visitor || !session) return null;
    mark(day);

    insertEvent(session, {
      at: time,
      type: "sent",
      path: FORM_PATH,
      label: application.nomination,
      value: application.id,
    });
    tally.add("events");
    tally.addBy("type", "sent", LIMITS.agent);
    tally.add("applications", 1, true);
    tally.utm.applications += 1;
    raise(session, 4, tally);
    if (!session.engaged) {
      session.engaged = 1;
      tally.add("engaged");
    }
    session.applications += 1;
    session.last_at = time;
    saveSession(session);
    tally.write(session.utm_id);

    const tags =
      session.utm_id === null
        ? undefined
        : stats.get<Utm>(
            "SELECT source, medium, campaign, content, term FROM utm WHERE id = :id",
            { id: session.utm_id },
          );
    return {
      visitorId: visitor.id,
      sessionId: session.id,
      source: session.source,
      utm: tags ?? null,
      referrer: session.referrer,
      landing: session.landing,
      device: session.device,
      browser: session.browser,
      os: session.os,
      visit: visitor.visits,
    };
  });
}

/* ---------- Right now ---------- */

const ONLINE_WINDOW = 5 * 60 * 1000;

/** Visitors heard from in the last five minutes. Kept in memory: it empties on a restart and refills within minutes. */
export function onlineNow() {
  const since = Date.now() - ONLINE_WINDOW;
  for (const [visitor, seen] of memory.online) {
    if (seen < since) memory.online.delete(visitor);
  }
  return memory.online.size;
}

/* ---------- Forgetting ---------- */

/**
 * How long the log itself is kept, in days. The counters are kept for good:
 * past this age a visit still counts in every report, it just can no longer
 * be opened event by event. 0 keeps everything.
 */
function keepDays() {
  const days = Number(process.env.ANALYTICS_KEEP_DAYS ?? 180);
  return Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
}

const PRUNE_EVERY = 10 * 60 * 1000;

/** Drops log rows older than the keeping period, a slice at a time. */
export function prune() {
  const days = keepDays();
  const time = Date.now();
  if (days === 0 || time - memory.prunedAt < PRUNE_EVERY) return;
  memory.prunedAt = time;

  // The first rows of the oldest day still kept: everything before is older.
  const edge = stats.get<{ event_id: number; session_id: number }>(
    "SELECT event_id, session_id FROM marks WHERE day >= :day ORDER BY day LIMIT 1",
    { day: addDays(dayOf(time), -days) },
  );
  if (!edge) return;

  const events = stats.run(
    `DELETE FROM events WHERE id IN (
       SELECT id FROM events WHERE id < :edge ORDER BY id LIMIT 20000
     )`,
    { edge: edge.event_id },
  ).changes;
  const sessions = stats.run(
    `DELETE FROM sessions WHERE id IN (
       SELECT id FROM sessions WHERE id < :edge ORDER BY id LIMIT 5000
     )`,
    { edge: edge.session_id },
  ).changes;
  // More to drop: come back in a second rather than in ten minutes — soon
  // enough to catch up, rare enough not to slow the batches down.
  if (events === 20000 || sessions === 5000) {
    memory.prunedAt = time - PRUNE_EVERY + 1000;
  }
}
