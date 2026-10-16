import "server-only";

type HeaderBag = { get(name: string): string | null };

/**
 * The visitor's address, for rate limits and nothing else.
 *
 * Proxies append to X-Forwarded-For, so its first entry is whatever the client
 * chose to send; the last one was written by the proxy in front of us.
 */
export function clientIp(headers: HeaderBag) {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || "unknown";
}

/** Whether the visitor reached us over HTTPS (the proxy in front says so). */
export function isHttps(headers: HeaderBag) {
  return headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
}
