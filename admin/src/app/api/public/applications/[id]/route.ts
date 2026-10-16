import type { NextRequest } from "next/server";
import { accountHolder } from "@/lib/accounts";
import { updateApplication } from "@/lib/applications";
import {
  CLOSED,
  NOT_FOUND,
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

/** The applicant edits their own application; it goes back to moderation. */
export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/public/applications/[id]">,
) {
  const { id } = await context.params;
  const who = await accountHolder();
  if (!who) return problem(404, NOT_FOUND);
  if (!isAccepting()) return problem(403, CLOSED);
  if (!allow(`edit:${clientIp(request.headers)}`, 60, HOUR)) {
    return problem(429, TOO_MANY);
  }

  const parsed = parseApplication(await readJson(request));
  if ("error" in parsed) return problem(400, parsed.error);

  const result = updateApplication(who, id, parsed.input);
  if (typeof result === "string") return problem(...SAVE_PROBLEMS[result]);
  return Response.json(toPublic(result));
}
