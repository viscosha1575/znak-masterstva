"use server";

import type { FormState } from "@/app/(panel)/applications/[id]/actions";
import { endOtherSessions, requireUser } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/passwords";
import { allow, MINUTE } from "@/lib/rate-limit";
import { passwordHashOf, setPassword } from "@/lib/users";

export async function changePasswordAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const repeat = String(form.get("repeat") ?? "");

  if (next.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Новый пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
    };
  }
  if (next.length > 200) return { error: "Новый пароль слишком длинный" };
  if (next !== repeat) return { error: "Пароли не совпадают" };
  if (next === current) {
    return { error: "Новый пароль совпадает с текущим" };
  }

  // Someone at an unlocked computer should not get unlimited guesses either.
  if (!allow(`password:${user.id}`, 10, 15 * MINUTE)) {
    return { error: "Слишком много попыток. Попробуйте через 15 минут" };
  }
  const hash = passwordHashOf(user.id);
  if (!hash || !(await verifyPassword(current, hash))) {
    return { error: "Текущий пароль введён неверно" };
  }

  await setPassword(user.id, next);
  await endOtherSessions(user.id);
  return {
    notice: "Пароль изменён. На других устройствах понадобится войти заново",
  };
}
