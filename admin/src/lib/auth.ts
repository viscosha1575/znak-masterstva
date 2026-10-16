import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { get, now, run } from "@/lib/db";
import type { Role } from "@/lib/dictionaries";
import { isHttps } from "@/lib/request";

const COOKIE = "znak_admin";
const SESSION_DAYS = 14;

export type CurrentUser = {
  id: number;
  login: string;
  name: string;
  role: Role;
};

// Only the hash is stored: a leaked database does not hand out working sessions.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** The signed-in staff member, or `null`. Checked against the database on every request. */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  return (
    get<CurrentUser>(
      `SELECT users.id, users.login, users.name, users.role
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = :hash AND sessions.expires_at > :now AND users.active = 1`,
      { hash: hashToken(token), now: now() },
    ) ?? null
  );
});

/**
 * Gate for every page, action and route of the panel. Call it first: nothing
 * else — not the layout, not a hidden button — keeps a stranger out.
 */
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** Same, for what only administrators may see. Others get a plain 404. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  run("DELETE FROM sessions WHERE expires_at <= :now", { now: now() });
  run(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
     VALUES (:hash, :userId, :now, :expires)`,
    {
      hash: hashToken(token),
      userId,
      now: now(),
      expires: expires.toISOString(),
    },
  );

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(await headers()),
    path: "/",
    expires,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    run("DELETE FROM sessions WHERE token_hash = :hash", {
      hash: hashToken(token),
    });
  }
  store.delete(COOKIE);
}

/** Signs an account out everywhere: its password was reset by somebody else. */
export function endAllSessions(userId: number) {
  run("DELETE FROM sessions WHERE user_id = :userId", { userId });
}

/** Signs the account out everywhere except the browser making this request. */
export async function endOtherSessions(userId: number) {
  const token = (await cookies()).get(COOKIE)?.value;
  run("DELETE FROM sessions WHERE user_id = :userId AND token_hash <> :hash", {
    userId,
    hash: token ? hashToken(token) : "",
  });
}
