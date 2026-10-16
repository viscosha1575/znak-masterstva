import type { NextRequest } from "next/server";
import {
  accountTaken,
  createAccount,
  hasAccount,
  MIN_APPLICANT_PASSWORD,
  parsePassword,
} from "@/lib/accounts";
import { ownApplications } from "@/lib/applications";
import { participant } from "@/lib/participant";
import { problem, readJson, TOO_MANY, toPublic } from "@/lib/public-api";
import { allow, HOUR } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isAccepting } from "@/lib/settings";

/**
 * An applicant from before accounts existed sets their password: the browser
 * their applications were sent from is the proof that they are theirs. The
 * account is opened on the e-mail and the phone of the first of them, and the
 * applications are given out from then on.
 */
export async function POST(request: NextRequest) {
  if (!allow(`account:${clientIp(request.headers)}`, 20, HOUR)) {
    return problem(429, TOO_MANY);
  }

  const who = await participant();
  const own = who ? ownApplications(who) : [];
  if (!who || own.length === 0) {
    return problem(404, "С этого устройства заявок не подавали");
  }

  if (!hasAccount(who)) {
    const password = parsePassword(await readJson(request, 10_000));
    if (!password) {
      return problem(
        400,
        `Придумайте пароль — не короче ${MIN_APPLICANT_PASSWORD} символов`,
      );
    }
    const { email, phone } = own[0];
    if (
      accountTaken(email, phone) ||
      !(await createAccount(who, email, phone, password))
    ) {
      return problem(
        409,
        "С почтой или телефоном из этой заявки уже есть личный кабинет. Войдите в него",
      );
    }
  }

  return Response.json(
    {
      accepting: isAccepting(),
      account: true,
      passwordNeeded: false,
      applications: own.map(toPublic),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
