import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const MIN_PASSWORD_LENGTH = 10;

// scrypt work factors; stored with every hash so they can be raised later
// without invalidating the passwords already saved.
const COST = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 32;

function derive(
  password: string,
  salt: Buffer,
  cost: { N: number; r: number; p: number },
  length: number,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      length,
      // The default memory ceiling (32 MB) is exactly what N = 2^15 needs; leave headroom.
      { ...cost, maxmem: 256 * cost.N * cost.r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** `scrypt$N$r$p$salt$key`, salt and key in base64url. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST, KEY_LENGTH);
  return [
    "scrypt",
    COST.N,
    COST.r,
    COST.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !key) return false;

  const expected = Buffer.from(key, "base64url");
  const actual = await derive(
    password,
    Buffer.from(salt, "base64url"),
    { N: Number(N), r: Number(r), p: Number(p) },
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}
