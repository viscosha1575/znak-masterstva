"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addEvent,
  decide,
  type Decision,
  deleteApplication,
  findApplication,
} from "@/lib/applications";
import { requireAdmin, requireUser } from "@/lib/auth";
import { STATUSES, type Status } from "@/lib/dictionaries";
import { decisionLetter } from "@/lib/letters";
import { accountUrl, mailConfigured, sendLetter } from "@/lib/mail";
import { removeApplicationFiles } from "@/lib/photos";

export type FormState = {
  error?: string;
  /** Something went as planned and is worth saying. */
  notice?: string;
  /** The main thing worked, a side effect did not. */
  warning?: string;
};

const DECISIONS: Decision[] = ["approved", "rejected", "moderation"];
const MIN_REASON = 10;
const MAX_REASON = 3000;
const MAX_NOTE = 3000;

export async function decideAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const id = Number(form.get("id"));
  const decision = DECISIONS.find((item) => item === form.get("decision"));
  const expected = STATUSES.find((item) => item.id === form.get("expected"))
    ?.id as Status | undefined;
  const reason = String(form.get("reason") ?? "").trim();
  if (!Number.isInteger(id) || !decision || !expected) {
    return { error: "Не получилось сохранить решение. Обновите страницу" };
  }
  if (decision === "rejected") {
    if (reason.length < MIN_REASON) {
      return {
        error: reason
          ? "Опишите причину подробнее: участник прочитает её в письме"
          : "Напишите причину отказа: участник прочитает её в письме",
      };
    }
    if (reason.length > MAX_REASON) {
      return { error: `Причина должна уместиться в ${MAX_REASON} знаков` };
    }
  }

  const result = decide(id, decision, { expected, userId: user.id, reason });
  if (result === "missing") {
    return { error: "Заявки больше нет — возможно, её удалили" };
  }
  // Whatever happened, the page the moderator is looking at is out of date.
  revalidatePath("/", "layout");
  if (result === "stale") {
    return {
      error:
        "Пока вы читали заявку, её статус изменился. Страница обновлена — проверьте ещё раз",
    };
  }
  if (decision === "moderation") return {};

  // The decision stands whether or not the letter goes out.
  const application = findApplication(id)!;
  if (!mailConfigured()) {
    return {
      warning:
        "Решение сохранено, но письмо участнику не ушло: отправка почты не настроена",
    };
  }
  if (form.get("notify") !== "on") {
    return { notice: "Решение сохранено. Письмо участнику не отправлялось" };
  }
  const outcome = await sendLetter(
    application.email,
    decisionLetter(application, decision, { reason, accountUrl: accountUrl() }),
  );
  addEvent(
    id,
    "email",
    {
      to: application.email,
      sent: outcome.sent,
      error: outcome.sent ? undefined : outcome.error,
    },
    user.id,
  );
  revalidatePath("/", "layout");
  return outcome.sent
    ? { notice: `Решение сохранено, письмо отправлено на ${application.email}` }
    : {
        warning: `Решение сохранено, но письмо участнику не ушло: ${outcome.error}`,
      };
}

export async function addNoteAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const id = Number(form.get("id"));
  const text = String(form.get("text") ?? "").trim();
  if (!text) return { error: "Заметка пустая" };
  if (text.length > MAX_NOTE) {
    return { error: `Заметка должна уместиться в ${MAX_NOTE} знаков` };
  }
  if (!Number.isInteger(id) || !findApplication(id)) {
    return { error: "Заявки больше нет — возможно, её удалили" };
  }

  addEvent(id, "note", { text }, user.id);
  revalidatePath("/", "layout");
  return {};
}

/** Removes an application for good, photos included. Administrators only. */
export async function deleteAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || !deleteApplication(id)) {
    return { error: "Заявки уже нет" };
  }
  await removeApplicationFiles(id);
  revalidatePath("/", "layout");
  redirect("/applications");
}
