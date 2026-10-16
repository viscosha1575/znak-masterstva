import "server-only";

import { openStore } from "@/lib/db";

/*
 * The site's visit statistics: who came, from where, what they looked at and
 * clicked. A database of its own, next to znak.db in DATA_DIR.
 *
 * Two kinds of tables live here.
 *
 * The log — visitors, sessions, events — is what happened, row by row. It
 * grows with every visit and is only ever read a page at a time, newest
 * first, by row number.
 *
 * The counters — daily, daily_by, hourly, utm_daily — are the numbers the
 * panel shows. They are updated in the same transaction that writes the log
 * (lib/analytics/ingest.ts), so a report adds up a few hundred small rows and
 * costs the same after ten million events as after ten. Nothing in the panel
 * counts log rows.
 *
 * Times are Unix milliseconds; days are Moscow calendar days, YYYY-MM-DD.
 */
const MIGRATIONS = [
  `
  CREATE TABLE visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- SHA-256 of the visitor's cookie: the cookie itself is not kept.
    token TEXT NOT NULL UNIQUE,
    first_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    -- The last day the visitor was seen on. Tells a day's first visit from
    -- its later ones, which is what makes unique counts cheap (see daily_by).
    last_day TEXT NOT NULL DEFAULT '',
    visits INTEGER NOT NULL DEFAULT 0,
    -- What brought the visitor the very first time.
    utm_id INTEGER,
    source TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    -- 1 for the visitor's first visit ever.
    is_new INTEGER NOT NULL,
    utm_id INTEGER,
    -- utm_source, else the site the visitor came from, else '' (typed the address).
    source TEXT NOT NULL,
    referrer TEXT NOT NULL,
    landing TEXT NOT NULL,
    exit TEXT NOT NULL,
    device TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    screen TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    events INTEGER NOT NULL DEFAULT 0,
    -- Time the site was actually on screen.
    active_ms INTEGER NOT NULL DEFAULT 0,
    -- 1 once the visit went beyond a single page view.
    engaged INTEGER NOT NULL DEFAULT 0,
    -- How far the visitor got with the application form:
    -- 0 never opened it, 1 opened, 2 started filling in, 3 pressed "send", 4 sent.
    funnel INTEGER NOT NULL DEFAULT 0,
    applications INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX sessions_visitor ON sessions (visitor_id, id);
  CREATE INDEX sessions_utm ON sessions (utm_id, id) WHERE utm_id IS NOT NULL;
  CREATE INDEX sessions_applied ON sessions (id) WHERE applications > 0;

  CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    at INTEGER NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    -- What was clicked, which fields failed, the nomination applied to.
    label TEXT NOT NULL DEFAULT '',
    -- Where a clicked link leads.
    target TEXT NOT NULL DEFAULT '',
    -- Scroll depth in per cent, time on the page in ms, the application's number.
    value INTEGER
  );
  CREATE INDEX events_session ON events (session_id, id);
  CREATE INDEX events_type ON events (type, id);

  -- The first row numbers of each day: turns "from the 3rd to the 9th" into a
  -- range of ids, so date filters need no index over the log.
  CREATE TABLE marks (
    day TEXT PRIMARY KEY,
    event_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL
  ) WITHOUT ROWID;

  CREATE TABLE utm (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    medium TEXT NOT NULL,
    campaign TEXT NOT NULL,
    content TEXT NOT NULL,
    term TEXT NOT NULL,
    first_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    UNIQUE (source, medium, campaign, content, term)
  );

  CREATE TABLE utm_daily (
    day TEXT NOT NULL,
    utm_id INTEGER NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    new_visitors INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    form_starts INTEGER NOT NULL DEFAULT 0,
    applications INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, utm_id)
  ) WITHOUT ROWID;

  -- One number per day and metric: visits, views, clicks and the like.
  CREATE TABLE daily (
    day TEXT NOT NULL,
    metric TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (day, metric)
  ) WITHOUT ROWID;

  -- The same, broken down: views by page, visits by source or device, clicks
  -- by button.
  --
  -- The metric 'uniq' counts each day's visitors by the day they were last
  -- seen before ('' for newcomers). A visitor active between A and B has
  -- exactly one such row inside the range whose key is earlier than A — their
  -- first day in it — so "unique visitors from A to B" is a sum over these
  -- rows, exact, with no pass over the visitors themselves.
  CREATE TABLE daily_by (
    metric TEXT NOT NULL,
    day TEXT NOT NULL,
    key TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (metric, day, key)
  ) WITHOUT ROWID;

  -- Today's chart is drawn by the hour.
  CREATE TABLE hourly (
    day TEXT NOT NULL,
    hour INTEGER NOT NULL,
    metric TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (day, hour, metric)
  ) WITHOUT ROWID;
  `,
];

export const stats = openStore("analytics.db", MIGRATIONS, "__znakStats");

/* ---------- The Moscow calendar ---------- */

// Russia keeps one offset all year, so the shift is a constant.
const MOSCOW = 3 * 60 * 60 * 1000;

/** The Moscow calendar day of a moment, YYYY-MM-DD. */
export function dayOf(time: number) {
  return new Date(time + MOSCOW).toISOString().slice(0, 10);
}

/** The Moscow hour of a moment, 0–23. */
export function hourOf(time: number) {
  return new Date(time + MOSCOW).getUTCHours();
}

/** A day `shift` days away from `day`. */
export function addDays(day: string, shift: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + shift);
  return date.toISOString().slice(0, 10);
}

export function today() {
  return dayOf(Date.now());
}
