import "server-only";

/*
 * Counters in memory: enough for one process, which is how the panel runs.
 * They reset on restart, which only ever errs in the visitor's favour.
 */
const holder = globalThis as {
  __znakLimits?: Map<string, { count: number; resetAt: number }>;
};
const buckets = (holder.__znakLimits ??= new Map());

function bucket(key: string, windowMs: number) {
  const time = Date.now();
  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= time) {
    entry = { count: 0, resetAt: time + windowMs };
    buckets.set(key, entry);
  }

  // Keep the map from growing without bound under a flood of distinct keys.
  if (buckets.size > 10_000) {
    for (const [name, value] of buckets) {
      if (value.resetAt <= time) buckets.delete(name);
    }
  }
  return entry;
}

/** Counts one attempt. `false` once `max` attempts were made within the window. */
export function allow(key: string, max: number, windowMs: number) {
  const entry = bucket(key, windowMs);
  entry.count += 1;
  return entry.count <= max;
}

/** Whether `max` attempts were already made — without counting this one. */
export function exhausted(key: string, max: number, windowMs: number) {
  return bucket(key, windowMs).count >= max;
}

export function forget(key: string) {
  buckets.delete(key);
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
