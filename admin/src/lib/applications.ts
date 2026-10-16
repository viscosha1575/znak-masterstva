import "server-only";

import { randomUUID } from "node:crypto";
import type { Origin } from "@/lib/analytics/types";
import { all, get, now, run, transaction } from "@/lib/db";
import { MAX_APPLICATIONS, STATUSES, type Status } from "@/lib/dictionaries";

/** What an applicant fills in. Validated in lib/validation.ts before it gets here. */
export type ApplicationInput = {
  name: string;
  email: string;
  phone: string;
  /**
   * The applicant's nine-digit Avito ID. Applications sent before the form
   * asked for the ID carry a link to the profile instead.
   */
  avitoUrl: string;
  city: string;
  kind: string;
  field: string;
  nomination: string;
  story: string;
  consentPromo: boolean;
};

export type Application = ApplicationInput & {
  id: number;
  publicId: string;
  status: Status;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  moderatedAt: string | null;
  moderatedBy: string | null;
  /** Where the applicant came from; `null` when the visit was not recorded. */
  origin: Origin | null;
};

type Row = {
  id: number;
  public_id: string;
  participant: string;
  name: string;
  email: string;
  phone: string;
  avito_url: string;
  profile_key: string;
  city: string;
  kind: string;
  field: string;
  nomination: string;
  story: string;
  consent_promo: number;
  status: Status;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  moderated_at: string | null;
  moderator: string | null;
  origin: string | null;
};

const SELECT = `
  SELECT applications.*, users.name AS moderator
  FROM applications LEFT JOIN users ON users.id = applications.moderated_by`;

function toApplication(row: Row): Application {
  return {
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avitoUrl: row.avito_url,
    city: row.city,
    kind: row.kind,
    field: row.field,
    nomination: row.nomination,
    story: row.story,
    consentPromo: row.consent_promo === 1,
    status: row.status,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    moderatedAt: row.moderated_at,
    moderatedBy: row.moderator,
    origin: row.origin ? (JSON.parse(row.origin) as Origin) : null,
  };
}

/* ---------- Search ---------- */

function normalise(text: string) {
  return text.toLowerCase().replaceAll("ё", "е");
}

function haystack(input: ApplicationInput) {
  return normalise(
    [
      input.name,
      input.email,
      input.phone,
      input.phone.replace(/\D/g, ""),
      input.city,
      input.field,
      input.avitoUrl,
    ].join(" "),
  );
}

/**
 * One spelling of the applicant's Avito ID, to find their other applications
 * by. The form asks for the nine-digit ID; applications from before that
 * carry a link to the profile — avito.ru/user/abc for
 * https://www.avito.ru/user/abc/?utm=1 and its other spellings.
 */
function profileKey(url: string) {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^(www|m)\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

export type Filter = {
  status?: Status;
  nomination?: string;
  kind?: string;
  query?: string;
};

function conditions(filter: Filter) {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (filter.status) {
    clauses.push("status = :status");
    params.status = filter.status;
  }
  if (filter.nomination) {
    clauses.push("nomination = :nomination");
    params.nomination = filter.nomination;
  }
  if (filter.kind) {
    clauses.push("kind = :kind");
    params.kind = filter.kind;
  }

  // Every word has to occur somewhere in the application.
  const words = normalise(filter.query ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  words.forEach((word, index) => {
    const like = `search LIKE :word${index} ESCAPE '\\'`;
    params[`word${index}`] = `%${word.replace(/[\\%_]/g, "\\$&")}%`;

    // A lone number may also be the application's own number.
    const number = words.length === 1 && /^[#№]?(\d{1,9})$/.exec(word)?.[1];
    if (number) {
      clauses.push(`(applications.id = :number OR ${like})`);
      params.number = Number(number);
    } else {
      clauses.push(like);
    }
  });

  return {
    where: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

/* ---------- Reading: staff ---------- */

export type ApplicationListItem = {
  id: number;
  name: string;
  city: string;
  kind: string;
  field: string;
  nomination: string;
  status: Status;
  createdAt: string;
  photoCount: number;
};

export const PAGE_SIZE = 30;

export function listApplications(
  filter: Filter,
  options: { sort: "new" | "old"; page: number },
) {
  const { where, params } = conditions(filter);
  const { total } = get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM applications ${where}`,
    params,
  )!;

  const direction = options.sort === "old" ? "ASC" : "DESC";
  const rows = all<{
    id: number;
    name: string;
    city: string;
    kind: string;
    field: string;
    nomination: string;
    status: Status;
    created_at: string;
    photo_count: number;
  }>(
    `SELECT id, name, city, kind, field, nomination, status, created_at,
       (SELECT COUNT(*) FROM photos WHERE photos.application_id = applications.id) AS photo_count
     FROM applications ${where}
     ORDER BY created_at ${direction}, id ${direction}
     LIMIT :limit OFFSET :offset`,
    {
      ...params,
      limit: PAGE_SIZE,
      offset: (options.page - 1) * PAGE_SIZE,
    },
  );

  return {
    total,
    items: rows.map((row): ApplicationListItem => ({
      id: row.id,
      name: row.name,
      city: row.city,
      kind: row.kind,
      field: row.field,
      nomination: row.nomination,
      status: row.status,
      createdAt: row.created_at,
      photoCount: row.photo_count,
    })),
  };
}

function emptyCounts() {
  return Object.fromEntries(STATUSES.map(({ id }) => [id, 0])) as Record<
    Status,
    number
  >;
}

/** How many applications each status tab would show under the other filters. */
export function countByStatus(filter: Filter = {}) {
  const { where, params } = conditions({ ...filter, status: undefined });
  const counts = emptyCounts();
  for (const row of all<{ status: Status; total: number }>(
    `SELECT status, COUNT(*) AS total FROM applications ${where} GROUP BY status`,
    params,
  )) {
    counts[row.status] = row.total;
  }
  return counts;
}

/** Every application under the filter, oldest first — for the spreadsheet export. */
export function exportApplications(filter: Filter) {
  const { where, params } = conditions(filter);
  return all<Row & { photo_count: number }>(
    `SELECT applications.*, users.name AS moderator,
       (SELECT COUNT(*) FROM photos WHERE photos.application_id = applications.id) AS photo_count
     FROM applications LEFT JOIN users ON users.id = applications.moderated_by
     ${where}
     ORDER BY applications.id`,
    params,
  ).map((row) => ({ ...toApplication(row), photoCount: row.photo_count }));
}

export function findApplication(id: number) {
  const row = get<Row>(`${SELECT} WHERE applications.id = :id`, { id });
  return row && toApplication(row);
}

export type RelatedApplication = {
  id: number;
  name: string;
  nomination: string;
  status: Status;
  /** Sent from the same browser — the applicant's own second entry. */
  sameParticipant: boolean;
};

/**
 * Other applications that look like the same person: sent from the same
 * browser, or carrying the same e-mail, phone or Avito profile. The site only
 * enforces "two per participant" per browser, so this is how repeats show up.
 */
export function relatedApplications(id: number): RelatedApplication[] {
  return all<{
    id: number;
    name: string;
    nomination: string;
    status: Status;
    same: number;
  }>(
    `SELECT other.id, other.name, other.nomination, other.status,
       other.participant = self.participant AS same
     FROM applications AS self JOIN applications AS other ON other.id <> self.id
     WHERE self.id = :id AND (
       other.participant = self.participant
       OR lower(other.email) = lower(self.email)
       OR other.phone = self.phone
       OR other.profile_key = self.profile_key
     )
     ORDER BY other.id`,
    { id },
  ).map((row) => ({
    id: row.id,
    name: row.name,
    nomination: row.nomination,
    status: row.status,
    sameParticipant: row.same === 1,
  }));
}

/** The next application waiting for a decision after this one, oldest first, wrapping round. */
export function nextInQueue(afterId: number) {
  return get<{ id: number }>(
    `SELECT id FROM applications
     WHERE status = 'moderation' AND id <> :id
     ORDER BY id < :id, id
     LIMIT 1`,
    { id: afterId },
  )?.id;
}

/* ---------- History ---------- */

export type EventType =
  | "created"
  | "edited"
  | "approved"
  | "rejected"
  | "returned"
  | "note"
  | "email";

export type HistoryEvent = {
  id: number;
  type: EventType;
  data: Record<string, unknown>;
  createdAt: string;
  /** The staff member behind it; `null` for what the applicant did. */
  author: string | null;
};

export function addEvent(
  applicationId: number,
  type: EventType,
  data: Record<string, unknown> = {},
  userId: number | null = null,
) {
  run(
    `INSERT INTO events (application_id, user_id, type, data, created_at)
     VALUES (:applicationId, :userId, :type, :data, :now)`,
    { applicationId, userId, type, data: JSON.stringify(data), now: now() },
  );
}

type EventRow = {
  id: number;
  type: EventType;
  data: string;
  created_at: string;
  author: string | null;
};

function toEvent(row: EventRow): HistoryEvent {
  return {
    id: row.id,
    type: row.type,
    data: JSON.parse(row.data) as Record<string, unknown>,
    createdAt: row.created_at,
    author: row.author,
  };
}

export function listEvents(applicationId: number) {
  return all<EventRow>(
    `SELECT events.id, events.type, events.data, events.created_at, users.name AS author
     FROM events LEFT JOIN users ON users.id = events.user_id
     WHERE events.application_id = :applicationId
     ORDER BY events.id DESC`,
    { applicationId },
  ).map(toEvent);
}

export type ActivityItem = HistoryEvent & {
  applicationId: number;
  applicant: string;
};

/** The latest events across all applications, for the overview. */
export function recentActivity(limit: number): ActivityItem[] {
  return all<EventRow & { application_id: number; applicant: string }>(
    `SELECT events.id, events.type, events.data, events.created_at, users.name AS author,
       events.application_id, applications.name AS applicant
     FROM events
       JOIN applications ON applications.id = events.application_id
       LEFT JOIN users ON users.id = events.user_id
     WHERE events.type <> 'email'
     ORDER BY events.id DESC
     LIMIT :limit`,
    { limit },
  ).map((row) => ({
    ...toEvent(row),
    applicationId: row.application_id,
    applicant: row.applicant,
  }));
}

/* ---------- Overview numbers ---------- */

export function overview() {
  const byStatus = emptyCounts();
  const byNomination = new Map<string, Record<Status, number>>();

  for (const row of all<{ nomination: string; status: Status; total: number }>(
    "SELECT nomination, status, COUNT(*) AS total FROM applications GROUP BY nomination, status",
  )) {
    byStatus[row.status] += row.total;
    const counts = byNomination.get(row.nomination) ?? emptyCounts();
    counts[row.status] = row.total;
    byNomination.set(row.nomination, counts);
  }

  const { participants } = get<{ participants: number }>(
    "SELECT COUNT(DISTINCT participant) AS participants FROM applications",
  )!;
  const oldestWaiting = get<{ created_at: string }>(
    "SELECT created_at FROM applications WHERE status = 'moderation' ORDER BY id LIMIT 1",
  )?.created_at;

  // New applications today and over the last seven days, by the Moscow calendar.
  const since = (daysBack: number) =>
    get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM applications
       WHERE date(created_at, '+3 hours') >= date('now', '+3 hours', :shift)`,
      { shift: `-${daysBack} days` },
    )!.total;

  return {
    byStatus,
    byNomination,
    participants,
    oldestWaiting,
    today: since(0),
    week: since(6),
  };
}

/* ---------- Writing: staff ---------- */

export type Decision = "approved" | "rejected" | "moderation";

/**
 * Records a moderator's decision. `expected` is the status the moderator was
 * looking at: if a colleague got there first, nothing changes and the caller
 * is told so (`"stale"`).
 */
export function decide(
  id: number,
  decision: Decision,
  options: { expected: Status; userId: number; reason?: string },
): "done" | "stale" | "missing" {
  return transaction(() => {
    const current = get<{ status: Status }>(
      "SELECT status FROM applications WHERE id = :id",
      { id },
    );
    if (!current) return "missing";
    if (current.status !== options.expected || current.status === decision) {
      return "stale";
    }

    const decided = decision !== "moderation";
    run(
      `UPDATE applications
       SET status = :status, reject_reason = :reason, moderated_at = :at, moderated_by = :by
       WHERE id = :id`,
      {
        id,
        status: decision,
        reason: decision === "rejected" ? (options.reason ?? null) : null,
        at: decided ? now() : null,
        by: decided ? options.userId : null,
      },
    );
    addEvent(
      id,
      decision === "moderation" ? "returned" : decision,
      decision === "rejected" ? { reason: options.reason } : {},
      options.userId,
    );
    return "done";
  });
}

export function deleteApplication(id: number) {
  return run("DELETE FROM applications WHERE id = :id", { id }).changes > 0;
}

/* ---------- The applicant's side ---------- */

/** The application with this public id, if it belongs to the participant. */
export function findOwnApplication(participant: string, publicId: string) {
  const row = get<Row>(
    `${SELECT} WHERE applications.public_id = :publicId AND applications.participant = :participant`,
    { publicId, participant },
  );
  return row && toApplication(row);
}

export function ownApplications(participant: string) {
  return all<Row>(
    `${SELECT} WHERE applications.participant = :participant ORDER BY applications.id`,
    { participant },
  ).map(toApplication);
}

function values(input: ApplicationInput) {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    avitoUrl: input.avitoUrl,
    profileKey: profileKey(input.avitoUrl),
    city: input.city,
    kind: input.kind,
    field: input.field,
    nomination: input.nomination,
    story: input.story,
    consentPromo: input.consentPromo ? 1 : 0,
    search: haystack(input),
  };
}

export type SaveProblem = "limit" | "nomination" | "missing";

export function createApplication(
  participant: string,
  input: ApplicationInput,
): Application | SaveProblem {
  return transaction(() => {
    const existing = all<{ nomination: string }>(
      "SELECT nomination FROM applications WHERE participant = :participant",
      { participant },
    );
    if (existing.length >= MAX_APPLICATIONS) return "limit";
    if (existing.some((item) => item.nomination === input.nomination)) {
      return "nomination";
    }

    const { lastId } = run(
      `INSERT INTO applications (
         public_id, participant, name, email, phone, avito_url, profile_key, city, kind, field,
         nomination, story, consent_promo, search, created_at, updated_at
       ) VALUES (
         :publicId, :participant, :name, :email, :phone, :avitoUrl, :profileKey, :city, :kind, :field,
         :nomination, :story, :consentPromo, :search, :now, :now
       )`,
      { ...values(input), publicId: randomUUID(), participant, now: now() },
    );
    addEvent(lastId, "created");
    return findApplication(lastId)!;
  });
}

/** Notes the visit a new application was sent in (see lib/analytics/ingest.ts). */
export function setOrigin(id: number, origin: Origin) {
  run(
    `UPDATE applications
     SET visitor_id = :visitor, session_id = :session, origin = :origin
     WHERE id = :id`,
    {
      id,
      visitor: origin.visitorId,
      session: origin.sessionId,
      origin: JSON.stringify(origin),
    },
  );
}

/** Applications sent in a visit, or by a visitor across all their visits. */
export function applicationsFrom(
  by: { sessionId: number } | { visitorId: number },
) {
  const [column, value] =
    "sessionId" in by
      ? ["session_id", by.sessionId]
      : ["visitor_id", by.visitorId];
  return all<{ id: number; name: string; nomination: string; status: Status }>(
    `SELECT id, name, nomination, status FROM applications WHERE ${column} = :value ORDER BY id`,
    { value },
  );
}

const PHOTOS = "фото";

const FIELD_NAMES: Record<keyof ApplicationInput, string> = {
  name: "имя",
  email: "почта",
  phone: "телефон",
  avitoUrl: "Авито ID",
  city: "город",
  kind: "тип",
  field: "сфера деятельности",
  nomination: "номинация",
  story: "рассказ",
  consentPromo: "согласие на публикацию",
};

/**
 * Saves the applicant's edit. Whatever the status was, the application goes
 * back to moderation: what a moderator approved is no longer what is there.
 */
export function updateApplication(
  participant: string,
  publicId: string,
  input: ApplicationInput,
): Application | SaveProblem {
  return transaction(() => {
    const current = findOwnApplication(participant, publicId);
    if (!current) return "missing";

    const taken = get(
      `SELECT 1 AS taken FROM applications
       WHERE participant = :participant AND nomination = :nomination AND id <> :id`,
      { participant, nomination: input.nomination, id: current.id },
    );
    if (taken) return "nomination";

    const changed = (
      Object.keys(FIELD_NAMES) as (keyof ApplicationInput)[]
    ).filter((key) => current[key] !== input[key]);

    run(
      `UPDATE applications SET
         name = :name, email = :email, phone = :phone, avito_url = :avitoUrl,
         profile_key = :profileKey, city = :city, kind = :kind, field = :field,
         nomination = :nomination, story = :story, consent_promo = :consentPromo,
         search = :search, updated_at = :now,
         status = 'moderation', reject_reason = NULL, moderated_at = NULL, moderated_by = NULL
       WHERE id = :id`,
      { ...values(input), id: current.id, now: now() },
    );
    if (changed.length > 0 || current.status !== "moderation") {
      addEvent(current.id, "edited", {
        fields: changed.map((key) => FIELD_NAMES[key]),
        from: current.status,
      });
    }
    return findApplication(current.id)!;
  });
}

// How long after an application is created or edited its photo uploads still
// count as part of that same step.
const SAME_STEP = 10 * 60 * 1000;

/**
 * Call after the applicant added or removed a photo. `application` is the
 * application as it was before the change.
 *
 * The site saves the text first and the photos right after, one request each,
 * so the history folds them together: photos that follow an edit join that
 * edit's entry, and photos that follow the creation are simply part of the
 * new application. A change on an application a moderator has already decided
 * on sends it back to moderation, exactly as a text edit does.
 */
export function recordPhotoChange(application: Application) {
  transaction(() => {
    const last = get<{
      id: number;
      type: EventType;
      data: string;
      created_at: string;
    }>(
      `SELECT id, type, data, created_at FROM events
       WHERE application_id = :id AND type NOT IN ('note', 'email')
       ORDER BY id DESC LIMIT 1`,
      { id: application.id },
    );
    const sameStep =
      last !== undefined &&
      application.status === "moderation" &&
      Date.now() - Date.parse(last.created_at) < SAME_STEP;

    if (sameStep && last.type === "created") return;
    if (sameStep && last.type === "edited") {
      const data = JSON.parse(last.data) as { fields?: string[] };
      if (!data.fields?.includes(PHOTOS)) {
        run("UPDATE events SET data = :data WHERE id = :id", {
          id: last.id,
          data: JSON.stringify({
            ...data,
            fields: [...(data.fields ?? []), PHOTOS],
          }),
        });
      }
      return;
    }

    run(
      `UPDATE applications SET
         updated_at = :now, status = 'moderation', reject_reason = NULL,
         moderated_at = NULL, moderated_by = NULL
       WHERE id = :id`,
      { id: application.id, now: now() },
    );
    addEvent(application.id, "edited", {
      fields: [PHOTOS],
      from: application.status,
    });
  });
}
