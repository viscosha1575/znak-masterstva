import type { NextRequest } from "next/server";
import {
  accountTaken,
  createAccount,
  hasAccount,
  MIN_APPLICANT_PASSWORD,
  parsePassword,
} from "@/lib/accounts";
import { recordApplication } from "@/lib/analytics/ingest";
import { visitorToken } from "@/lib/analytics/visitor";
import {
  createApplication,
  ownApplications,
  setOrigin,
} from "@/lib/applications";
import { nominationTitle } from "@/lib/dictionaries";
import { participant, participantOrNew } from "@/lib/participant";
import {
  CLOSED,
  problem,
  readJson,
  SAVE_PROBLEMS,
  TOO_MANY,
  toPublic,
} from "@/lib/public-api";
import { allow, HOUR } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isAccepting } from "@/lib/settings";
import { parseApplication } from "@/lib/validation";

/**
 * The applicant's own applications, whether new ones are being taken, and
 * whether this applicant has an account — a password to sign in with.
 *
 * Without an account nothing is given out. `passwordNeeded` then says that
 * this browser does have applications, sent before accounts existed, and that
 * setting a password (api/public/account) will open them.
 */
export async function GET() {
  const who = await participant();
  const account = who ? hasAccount(who) : false;
  const own = who ? ownApplications(who) : [];
  return Response.json(
    {
      accepting: isAccepting(),
      account,
      passwordNeeded: !account && own.length > 0,
      applications: account ? own.map(toPublic) : [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isAccepting()) return problem(403, CLOSED);
  if (!allow(`apply:${clientIp(request.headers)}`, 20, HOUR)) {
    return problem(429, TOO_MANY);
  }

  const body = await readJson(request);
  const parsed = parseApplication(body);
  if ("error" in parsed) return problem(400, parsed.error);

  // The first application comes with a password: it opens the applicant's
  // account, which they later sign in to with this e-mail or phone.
  const known = await participant();
  const password = known && hasAccount(known) ? undefined : parsePassword(body);
  if (password === null) {
    return problem(
      400,
      `Придумайте пароль — не короче ${MIN_APPLICANT_PASSWORD} символов`,
    );
  }
  const { email, phone } = parsed.input;
  if (password && accountTaken(email, phone)) {
    return problem(
      409,
      "С такой почтой или телефоном уже есть личный кабинет. Войдите в него, чтобы подать ещё одну заявку",
    );
  }

  const who = await participantOrNew();
  const result = createApplication(who, parsed.input);
  if (typeof result === "string") return problem(...SAVE_PROBLEMS[result]);
  if (password) await createAccount(who, email, phone, password);

  // The statistics are a courtesy to the application, never a condition of it.
  try {
    const origin = recordApplication(await visitorToken(), {
      id: result.id,
      nomination: nominationTitle(result.nomination),
    });
    if (origin) setOrigin(result.id, origin);
  } catch (error) {
    console.error("Could not record the application's source", error);
  }
  return Response.json(toPublic(result), { status: 201 });
}
