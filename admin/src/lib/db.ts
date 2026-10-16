import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from "node:sqlite";

/*
 * Everything the award keeps lives in one folder, DATA_DIR: the SQLite
 * databases and the uploaded photos. Backing the folder up backs up the award.
 *
 * znak.db holds what cannot be lost: applications, staff, settings. The site's
 * visit statistics sit in a file of their own (lib/analytics/store.ts): they
 * are written far more often, and a flood of visits must never queue up
 * behind — or in front of — a moderator's decision.
 *
 * In production the folder must be named explicitly. The default below sits
 * inside the app folder, and a deploy replaces that folder wholesale.
 */
function dataDir() {
  const configured = process.env.DATA_DIR;
  if (configured) return path.resolve(configured);
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATA_DIR is not set. Point it at a folder outside the app, e.g. DATA_DIR=/var/lib/znak-masterstva",
    );
  }
  return path.resolve("data");
}

export function uploadsDir() {
  return path.join(dataDir(), "uploads");
}

/*
 * Schema history. Each entry runs once, in order; the database remembers how
 * many it has seen in PRAGMA user_version. Never edit an entry that has
 * shipped — append a new one.
 */
const MIGRATIONS = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- The id the site knows the application by; the number above stays internal.
    public_id TEXT NOT NULL UNIQUE,
    -- SHA-256 of the participant's cookie: who may see and edit the application.
    participant TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    avito_url TEXT NOT NULL,
    -- The profile link without protocol, "www." and the like: spots repeat entries.
    profile_key TEXT NOT NULL,
    city TEXT NOT NULL,
    kind TEXT NOT NULL,
    field TEXT NOT NULL,
    nomination TEXT NOT NULL,
    story TEXT NOT NULL,
    consent_promo INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'moderation'
      CHECK (status IN ('moderation', 'approved', 'rejected')),
    reject_reason TEXT,
    -- Lower-cased haystack for the search box (SQLite's LIKE ignores case for ASCII only).
    search TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    moderated_at TEXT,
    moderated_by INTEGER REFERENCES users (id) ON DELETE SET NULL
  );
  CREATE INDEX applications_status ON applications (status, created_at);
  CREATE UNIQUE INDEX applications_nomination ON applications (participant, nomination);

  CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    -- 0 when the image could not be decoded (HEIC, for one): only the original is kept.
    has_preview INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX photos_application ON photos (application_id, created_at);

  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX events_application ON events (application_id, id);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  -- Where the applicant came from: the visit the application was sent in
  -- (lib/analytics), and a snapshot of its source that outlives the visit log.
  ALTER TABLE applications ADD COLUMN visitor_id INTEGER;
  ALTER TABLE applications ADD COLUMN session_id INTEGER;
  ALTER TABLE applications ADD COLUMN origin TEXT;
  CREATE INDEX applications_session ON applications (session_id) WHERE session_id IS NOT NULL;
  CREATE INDEX applications_visitor ON applications (visitor_id) WHERE visitor_id IS NOT NULL;
  `,
  `
  -- Applicants' accounts. An account is a password for a participant key (the
  -- key applications are stored under), found by the e-mail or the phone of
  -- the application it was created with. "logins" are the browsers signed in
  -- to it: the hash of each one's cookie.
  CREATE TABLE accounts (
    participant TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE logins (
    token TEXT PRIMARY KEY,
    participant TEXT NOT NULL REFERENCES accounts (participant) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );
  CREATE INDEX logins_participant ON logins (participant);
  `,
];

type Params = Record<string, SQLInputValue>;

type Connection = {
  database: DatabaseSync;
  /** How many entries of the schema history this database has seen. */
  version: number;
  statements: Map<string, StatementSync>;
};

/**
 * One SQLite file in DATA_DIR with its schema history and the four ways of
 * talking to it. `slot` names the connection: there is one per process, and
 * the dev server reloads modules on every edit, so the handle is parked on
 * globalThis rather than in a module variable.
 */
export function openStore(file: string, migrations: string[], slot: string) {
  const holder = globalThis as unknown as Record<
    string,
    Connection | undefined
  >;

  function migrate(link: Connection) {
    for (; link.version < migrations.length; link.version++) {
      link.database.exec("BEGIN IMMEDIATE");
      try {
        link.database.exec(migrations[link.version]);
        link.database.exec(`PRAGMA user_version = ${link.version + 1}`);
        link.database.exec("COMMIT");
      } catch (error) {
        link.database.exec("ROLLBACK");
        throw error;
      }
    }
  }

  function connection() {
    let link = holder[slot];
    if (!link) {
      mkdirSync(uploadsDir(), { recursive: true });
      // The data folder is outside the app: nothing in it belongs in a build.
      const database = new DatabaseSync(
        path.join(/* turbopackIgnore: true */ dataDir(), file),
      );
      database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;
        PRAGMA cache_size = -32000;
        PRAGMA temp_store = MEMORY;
      `);
      const { user_version: version } = database
        .prepare("PRAGMA user_version")
        .get() as { user_version: number };
      link = holder[slot] = { database, version, statements: new Map() };
    }
    // Also catches an entry appended while the dev server was running.
    if (link.version < migrations.length) migrate(link);
    return link;
  }

  // Compiling a statement costs more than running a small one, and the same
  // few dozen run over and over.
  function statement(sql: string) {
    const { database, statements } = connection();
    let prepared = statements.get(sql);
    if (!prepared) {
      // Filters assemble their SQL from parts; the set of texts is finite, but
      // nothing here should be able to grow without a ceiling.
      if (statements.size >= 500) statements.clear();
      prepared = database.prepare(sql);
      statements.set(sql, prepared);
    }
    return prepared;
  }

  return {
    /** Rows as plain objects (the driver's own have no prototype, which React refuses to serialise). */
    all<Row>(sql: string, params: Params = {}): Row[] {
      return statement(sql)
        .all(params)
        .map((row) => ({ ...row }) as Row);
    },

    get<Row>(sql: string, params: Params = {}): Row | undefined {
      const row = statement(sql).get(params);
      return row ? ({ ...row } as Row) : undefined;
    },

    run(sql: string, params: Params = {}) {
      const result = statement(sql).run(params);
      return {
        changes: Number(result.changes),
        lastId: Number(result.lastInsertRowid),
      };
    },

    /** Runs `work` in a transaction: all of its writes land, or none do. */
    transaction<Result>(work: () => Result): Result {
      const { database } = connection();
      database.exec("BEGIN IMMEDIATE");
      try {
        const result = work();
        database.exec("COMMIT");
        return result;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export const { all, get, run, transaction } = openStore(
  "znak.db",
  MIGRATIONS,
  "__znakStore",
);

export function now() {
  return new Date().toISOString();
}
