import type { NextRequest } from "next/server";

/*
 * The site keeps no data of its own. Applications and photos live in the
 * admin panel's service (../admin), which is not reachable from the internet;
 * this route passes the browser's requests on to its public API:
 *
 *   /api/applications  →  API_URL/api/public/applications
 *   /api/session       →  API_URL/api/public/session    (signing in)
 *   /api/activity      →  API_URL/api/public/activity   (visit statistics)
 *
 * API_URL is read when a request arrives, so it can differ between
 * environments without a rebuild. The default is the panel's dev server.
 */
function apiUrl() {
  return (process.env.API_URL ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
}

// Only what the API needs travels on: the visitor's cookies, the body's
// description, the browser's name (statistics tell phones from computers by
// it), and the visitor's address for rate limiting.
const REQUEST_HEADERS = [
  "content-type",
  "content-length",
  "cookie",
  "user-agent",
  "x-file-name",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
];
const RESPONSE_HEADERS = ["content-type", "content-length", "cache-control"];

// A 30 MB photo over a slow mobile connection takes a while.
const TIMEOUT = 10 * 60 * 1000;

async function forward(
  request: NextRequest,
  context: RouteContext<"/api/[...path]">,
) {
  const { path } = await context.params;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  // Photos are streamed through, never buffered: they can be tens of
  // megabytes. Everything else is small JSON and is read first, because a
  // streamed body cannot be sent twice and fetch then refuses to hand over a
  // 401 — which is how the API answers a wrong password.
  const streamed =
    hasBody &&
    !(request.headers.get("content-type") ?? "").startsWith("application/json");
  let upstream: Response;
  try {
    upstream = await fetch(
      `${apiUrl()}/api/public/${path.map(encodeURIComponent).join("/")}`,
      {
        method: request.method,
        headers,
        body: !hasBody
          ? undefined
          : streamed
            ? request.body
            : await request.arrayBuffer(),
        ...(streamed && { duplex: "half" }),
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT),
      } as RequestInit,
    );
  } catch {
    return Response.json(
      { error: "Сервис временно недоступен. Попробуйте чуть позже" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE };
