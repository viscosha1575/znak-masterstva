import "server-only";

import { get, run } from "@/lib/db";

function read(key: string) {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = :key", {
    key,
  })?.value;
}

function write(key: string, value: string) {
  run(
    `INSERT INTO settings (key, value) VALUES (:key, :value)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    { key, value },
  );
}

/** Whether the site takes new applications and edits. Open until someone closes it. */
export function isAccepting() {
  return read("accepting") !== "0";
}

export function setAccepting(open: boolean) {
  write("accepting", open ? "1" : "0");
}
