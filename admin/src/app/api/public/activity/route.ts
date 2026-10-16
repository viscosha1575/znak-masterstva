import { after, type NextRequest } from "next/server";
import { isBot, parseAgent } from "@/lib/analytics/agent";
import { ingest, parseBatch, prune } from "@/lib/analytics/ingest";
import { setVisitorToken, visitorToken } from "@/lib/analytics/visitor";
import { readJson } from "@/lib/public-api";
import { allow, HOUR, MINUTE } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

/*
 * What visitors do on the site: page views, clicks, steps through the
 * application form. The site's script posts it here in small batches.
 *
 * The answer never has a body and never explains itself: the sender is a
 * script that cannot act on it, and a stranger probing the endpoint learns
 * nothing from it.
 */
const done = (status = 204) => new Response(null, { status });

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  // A page sends a batch every few seconds at most; whole offices share an address.
  if (!allow(`activity:${ip}`, 300, MINUTE)) return done(429);

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return done();

  const batch = parseBatch(await readJson(request, 32_000));
  if (!batch) return done(400);

  const { cookie } = ingest(batch, {
    token: await visitorToken(),
    agent: parseAgent(userAgent),
    // Registering a visitor is the one thing here that adds a row for good.
    mayCreate: () => allow(`visitor:${ip}`, 600, HOUR),
  });
  if (cookie) await setVisitorToken(cookie);

  after(prune);
  return done();
}
