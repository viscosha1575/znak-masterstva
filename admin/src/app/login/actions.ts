"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { allow, exhausted, forget, MINUTE } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { ensureFirstAdmin, findCredentials, recordLogin } from "@/lib/users";

export type SignInState = { error?: string; login?: string };

// Failed attempts allowed per quarter of an hour: from one address, and on one login.
const WINDOW = 15 * MINUTE;
const PER_ADDRESS = 30;
const PER_LOGIN = 10;

// Checked when the login does not exist, so that a miss takes as long as a wrong password.
let decoy: Promise<string> | undefined;

export async function signIn(
  _previous: SignInState,
  form: FormData,
): Promise<SignInState> {
  const login = String(form.get("login") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!login || !password) {
    return { error: "Введите логин и пароль", login };
  }

  const byAddress = `signin:address:${clientIp(await headers())}`;
  const byLogin = `signin:login:${login.toLowerCase()}`;
  if (
    exhausted(byAddress, PER_ADDRESS, WINDOW) ||
    exhausted(byLogin, PER_LOGIN, WINDOW)
  ) {
    return {
      error: "Слишком много неудачных попыток. Попробуйте через 15 минут",
      login,
    };
  }

  await ensureFirstAdmin();
  const account = findCredentials(login);
  decoy ??= hashPassword(randomBytes(16).toString("hex"));
  const matches = await verifyPassword(
    password,
    account?.password_hash ?? (await decoy),
  );

  if (!account || !matches || account.active !== 1) {
    allow(byAddress, PER_ADDRESS, WINDOW);
    allow(byLogin, PER_LOGIN, WINDOW);
    return { error: "Неверный логин или пароль", login };
  }

  forget(byLogin);
  await startSession(account.id);
  recordLogin(account.id);
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
