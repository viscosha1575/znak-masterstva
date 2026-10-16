import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { get, now, run } from "@/lib/db";
import { isHttps } from "@/lib/request";

/*
 * An applicant is whoever holds this cookie. It is set with their first
 * application, or when they sign in to their account (lib/accounts.ts), and
 * is the key to their applications — so JavaScript cannot read it and the
 * database keeps just its hash.
 *
 * The hash of the cookie a first application was sent with becomes the
 * applicant's "participant key": their applications are stored under it. A
 * browser that signs in later gets a cookie of its own, which the `logins`
 * table maps to that key.
 */
const COOKIE = "znak_participant";
const YEAR = 365 * 24 * 60 * 60;

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** The participant key this cookie stands for. */
function keyOf(token: string) {
  const own = hash(token);
  const login = get<{ participant: string }>(
    "SELECT participant FROM logins WHERE token = :token",
    { token: own },
  );
  return login?.participant ?? own;
}

async function issue() {
  const token = randomBytes(32).toString("base64url");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(await headers()),
    path: "/",
    maxAge: YEAR,
  });
  return token;
}

/** The applicant making this request, or `null` if this browser is not known. */
export async function participant() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? keyOf(token) : null;
}

/** Same, issuing the cookie to a first-time applicant. */
export async function participantOrNew() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? keyOf(token) : hash(await issue());
}

/** Makes this browser the applicant with the given key: a fresh cookie, tied to their account. */
export async function signInAs(key: string) {
  const token = await issue();
  run(
    "INSERT INTO logins (token, participant, created_at) VALUES (:token, :key, :now)",
    { token: hash(token), key, now: now() },
  );
}

/** Forgets this browser. */
export async function signOut() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return;
  run("DELETE FROM logins WHERE token = :token", { token: hash(token) });
  store.delete(COOKIE);
}
