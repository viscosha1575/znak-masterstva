import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/accounts";
import { ownApplications } from "@/lib/applications";
import { signInAs, signOut } from "@/lib/participant";
import { problem, readJson, TOO_MANY, toPublic } from "@/lib/public-api";
import { allow, exhausted, forget, HOUR, MINUTE } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isAccepting } from "@/lib/settings";

/** The applicant signs in to their account with the e-mail or the phone of their application. */
export async function POST(request: NextRequest) {
  const body = (await readJson(request, 10_000)) as {
    login?: unknown;
    password?: unknown;
  } | null;
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!login || !password || login.length > 200 || password.length > 200) {
    return problem(400, "Введите телефон или почту и пароль");
  }

  // Guessing is slowed down twice: per address, and per account whatever the address.
  const byAddress = `signin:${clientIp(request.headers)}`;
  const byLogin = `signin-as:${login.toLowerCase()}`;
  if (exhausted(byLogin, 10, HOUR) || !allow(byAddress, 30, 10 * MINUTE)) {
    return problem(429, TOO_MANY);
  }

  const who = await authenticate(login, password);
  if (!who) {
    allow(byLogin, 10, HOUR);
    return problem(401, "Неверный телефон, почта или пароль");
  }
  forget(byLogin);

  await signInAs(who);
  return Response.json(
    {
      accepting: isAccepting(),
      account: true,
      passwordNeeded: false,
      applications: ownApplications(who).map(toPublic),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Signs this browser out. */
export async function DELETE() {
  await signOut();
  return new Response(null, { status: 204 });
}
