import "server-only";

import { all, get, now, run, transaction } from "@/lib/db";
import type { Role } from "@/lib/dictionaries";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export type StaffMember = {
  id: number;
  login: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type UserRow = {
  id: number;
  login: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
  last_login_at: string | null;
};

const COLUMNS = "id, login, name, role, active, created_at, last_login_at";

function toStaff(row: UserRow): StaffMember {
  return {
    id: row.id,
    login: row.login,
    name: row.name,
    role: row.role,
    active: row.active === 1,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export function listStaff() {
  return all<UserRow>(
    `SELECT ${COLUMNS} FROM users ORDER BY active DESC, name COLLATE NOCASE`,
  ).map(toStaff);
}

export function findStaff(id: number) {
  const row = get<UserRow>(`SELECT ${COLUMNS} FROM users WHERE id = :id`, {
    id,
  });
  return row && toStaff(row);
}

/** For the login form only: the one read that returns the password hash. */
export function findCredentials(login: string) {
  return get<{ id: number; password_hash: string; active: number }>(
    "SELECT id, password_hash, active FROM users WHERE login = :login",
    { login },
  );
}

export function passwordHashOf(id: number) {
  return get<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = :id",
    { id },
  )?.password_hash;
}

export function loginTaken(login: string) {
  return Boolean(
    get("SELECT 1 AS taken FROM users WHERE login = :login", { login }),
  );
}

export async function createStaff(input: {
  login: string;
  name: string;
  role: Role;
  password: string;
}) {
  const hash = await hashPassword(input.password);
  return run(
    `INSERT INTO users (login, name, role, password_hash, created_at)
     VALUES (:login, :name, :role, :hash, :now)`,
    {
      login: input.login,
      name: input.name,
      role: input.role,
      hash,
      now: now(),
    },
  ).lastId;
}

export async function setPassword(id: number, password: string) {
  const hash = await hashPassword(password);
  run("UPDATE users SET password_hash = :hash WHERE id = :id", { hash, id });
}

export function updateStaff(
  id: number,
  change: { name: string; role: Role; active: boolean },
) {
  transaction(() => {
    run(
      "UPDATE users SET name = :name, role = :role, active = :active WHERE id = :id",
      {
        id,
        name: change.name,
        role: change.role,
        active: change.active ? 1 : 0,
      },
    );
    // A switched-off account must stop working at once, not when its session expires.
    if (!change.active) {
      run("DELETE FROM sessions WHERE user_id = :id", { id });
    }
  });
}

/** How many accounts could still manage the panel if `exceptId` lost that right. */
export function otherActiveAdmins(exceptId: number) {
  return get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND active = 1 AND id <> :id",
    { id: exceptId },
  )!.total;
}

export function recordLogin(id: number) {
  run("UPDATE users SET last_login_at = :now WHERE id = :id", {
    id,
    now: now(),
  });
}

export type Bootstrap = "ready" | "created" | "missing" | "weak";

/**
 * The first account cannot be made from the panel — nobody is signed in yet —
 * so it comes from the environment: ADMIN_LOGIN and ADMIN_PASSWORD. They are
 * read only while the user list is empty; afterwards they can be removed.
 */
export async function ensureFirstAdmin(): Promise<Bootstrap> {
  const { total } = get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM users",
  )!;
  if (total > 0) return "ready";

  const login = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) return "missing";
  if (password.length < MIN_PASSWORD_LENGTH) return "weak";

  try {
    await createStaff({
      login,
      name: "Администратор",
      role: "admin",
      password,
    });
  } catch {
    // Two requests raced to create it; the other one won.
    return "ready";
  }
  return "created";
}
