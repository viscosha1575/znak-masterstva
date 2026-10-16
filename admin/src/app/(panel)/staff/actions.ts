"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/(panel)/applications/[id]/actions";
import { endAllSessions, endOtherSessions, requireAdmin } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/dictionaries";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import {
  createStaff,
  findStaff,
  loginTaken,
  otherActiveAdmins,
  setPassword,
  updateStaff,
} from "@/lib/users";

function readRole(form: FormData): Role | undefined {
  return ROLES.find((role) => role.id === form.get("role"))?.id;
}

function checkName(name: string) {
  return name.length >= 2 && name.length <= 80
    ? null
    : "Укажите имя сотрудника";
}

function checkPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
  }
  return password.length > 200 ? "Пароль слишком длинный" : null;
}

export async function createStaffAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  const name = String(form.get("name") ?? "").trim();
  const login = String(form.get("login") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = readRole(form);

  const problem =
    checkName(name) ??
    (/^[a-z0-9][a-z0-9._-]{2,39}$/i.test(login)
      ? null
      : "Логин — от 3 до 40 латинских букв, цифр, точек, дефисов") ??
    (role ? null : "Выберите роль") ??
    checkPassword(password);
  if (problem) return { error: problem };
  if (loginTaken(login)) return { error: "Такой логин уже занят" };

  await createStaff({ name, login, role: role!, password });
  revalidatePath("/staff");
  return { notice: `Учётная запись «${login}» создана` };
}

export async function updateStaffAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = Number(form.get("id"));
  const target = Number.isInteger(id) ? findStaff(id) : undefined;
  if (!target) return { error: "Учётная запись не найдена" };

  const name = String(form.get("name") ?? "").trim();
  const role = readRole(form);
  const active = form.get("active") === "on";
  const password = String(form.get("password") ?? "");

  const problem =
    checkName(name) ??
    (role ? null : "Выберите роль") ??
    (password ? checkPassword(password) : null);
  if (problem) return { error: problem };

  const losesControl =
    target.role === "admin" && target.active && (role !== "admin" || !active);
  if (losesControl && target.id === admin.id) {
    return {
      error:
        "Снять права администратора с себя или отключить себя нельзя — попросите другого администратора",
    };
  }
  if (losesControl && otherActiveAdmins(target.id) === 0) {
    return {
      error: "Это единственный администратор — панель останется без управления",
    };
  }

  updateStaff(target.id, { name, role: role!, active });
  if (password) {
    await setPassword(target.id, password);
    // Whoever knew the old password is signed out with it.
    if (target.id === admin.id) await endOtherSessions(admin.id);
    else endAllSessions(target.id);
  }
  revalidatePath("/", "layout");
  return { notice: "Сохранено" };
}
