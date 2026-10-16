import "server-only";

import { get, now, run } from "@/lib/db";
import { participant } from "@/lib/participant";
import { hashPassword, verifyPassword } from "@/lib/passwords";

/*
 * Applicants' accounts: a password for a participant key (lib/participant.ts).
 * The password is what opens the applicant's applications — in the browser
 * they were sent from as much as in any other.
 *
 * The account is created together with the first application, from the
 * password typed into the form, and is found by that application's e-mail or
 * phone. An applicant from before accounts existed has applications and no
 * password: until they set one (api/public/account), their browser's cookie
 * alone shows them nothing. There is no way to recover a forgotten password
 * yet.
 */

export const MIN_APPLICANT_PASSWORD = 8;
const MAX_APPLICANT_PASSWORD = 200;

/** The password from a request body, if it is one we accept. */
export function parsePassword(body: unknown) {
  const password = (body as { password?: unknown } | null)?.password;
  if (
    typeof password !== "string" ||
    password.length < MIN_APPLICANT_PASSWORD ||
    password.length > MAX_APPLICANT_PASSWORD
  ) {
    return null;
  }
  return password;
}

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

/** Eleven digits starting with 7, from any spelling of a Russian number; `null` if it is not one. */
function phoneKey(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `7${digits}`;
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return digits.length === 11 && digits.startsWith("7") ? digits : null;
}

export function hasAccount(participant: string) {
  return Boolean(
    get("SELECT 1 FROM accounts WHERE participant = :participant", {
      participant,
    }),
  );
}

/**
 * The applicant making this request, if they have an account. Without one the
 * applications of this browser stay closed: reading and changing them goes
 * through here.
 */
export async function accountHolder() {
  const who = await participant();
  return who && hasAccount(who) ? who : null;
}

/** Whether someone already signs in with this e-mail or this phone. */
export function accountTaken(email: string, phone: string) {
  return Boolean(
    get("SELECT 1 FROM accounts WHERE email = :email OR phone = :phone", {
      email: emailKey(email),
      phone: phoneKey(phone) ?? "",
    }),
  );
}

/** `false` if the e-mail or the phone was taken in the meantime. */
export async function createAccount(
  participant: string,
  email: string,
  phone: string,
  password: string,
) {
  const hashed = await hashPassword(password);
  const { changes } = run(
    `INSERT OR IGNORE INTO accounts (participant, email, phone, password, created_at)
     VALUES (:participant, :email, :phone, :password, :now)`,
    {
      participant,
      email: emailKey(email),
      phone: phoneKey(phone) ?? phone,
      password: hashed,
      now: now(),
    },
  );
  return changes > 0;
}

// Checked when no account matches, so that a wrong login takes as long as a wrong password.
let decoy: Promise<string> | undefined;

/** The participant key of the account with this login and password, or `null`. */
export async function authenticate(login: string, password: string) {
  const phone = phoneKey(login);
  const account = get<{ participant: string; password: string }>(
    "SELECT participant, password FROM accounts WHERE email = :email OR phone = :phone",
    { email: emailKey(login), phone: phone ?? "" },
  );
  if (!account) {
    decoy ??= hashPassword("no such applicant");
    await verifyPassword(password, await decoy);
    return null;
  }
  return (await verifyPassword(password, account.password))
    ? account.participant
    : null;
}
