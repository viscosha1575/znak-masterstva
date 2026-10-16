import "server-only";

import { cookies, headers } from "next/headers";
import { isHttps } from "@/lib/request";

/*
 * A visitor of the site is whoever holds this cookie: a random token with no
 * meaning of its own, set on the first page view. It ties a browser's visits
 * together and nothing else — no name, no address. JavaScript cannot read it,
 * and the database keeps only its hash.
 */
const COOKIE = "znak_visitor";
const YEAR = 365 * 24 * 60 * 60;

export async function visitorToken() {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function setVisitorToken(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(await headers()),
    path: "/",
    maxAge: YEAR,
  });
}
