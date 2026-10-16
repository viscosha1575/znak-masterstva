/*
 * Reading the analytics pages' state from the address bar. Anything
 * unexpected is ignored rather than refused: addresses get edited by hand.
 */

type RawParams = Record<string, string | string[] | undefined>;

/** Query parameters as plain strings: the first value of each, trimmed, empty ones dropped. */
export function plain(raw: RawParams) {
  const params: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(raw)) {
    const first = (Array.isArray(value) ? value[0] : value)?.trim();
    if (first) params[name] = first.slice(0, 200);
  }
  return params;
}

/** A positive whole number, or `undefined`. */
export function positive(value: string | undefined) {
  if (!value || !/^\d{1,15}$/.test(value)) return undefined;
  const number = Number(value);
  return number > 0 ? number : undefined;
}

/** The same address with some parameters changed; empty values drop out. */
export function withParams(
  path: string,
  params: Record<string, string | undefined>,
  change: Record<string, string | number | undefined> = {},
) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries({ ...params, ...change })) {
    if (value !== undefined && value !== "") query.set(name, String(value));
  }
  const tail = query.toString();
  return tail ? `${path}?${tail}` : path;
}
