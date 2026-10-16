import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/app/login/SignInForm";
import { Notice } from "@/components/ui/Notice";
import { currentUser } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { ensureFirstAdmin } from "@/lib/users";

export const metadata: Metadata = { title: "Вход" };

export default async function SignInPage() {
  if (await currentUser()) redirect("/");
  const accounts = await ensureFirstAdmin();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="card w-full max-w-[26rem] p-6 md:p-8">
        <p className="text-sm font-bold text-accent">Знак мастерства</p>
        <h1 className="mt-1 text-4xl leading-tight font-bold text-ink">Вход</h1>
        <p className="mt-2 text-base text-mute">
          Введите логин и пароль сотрудника.
        </p>

        {accounts === "missing" && (
          <Notice tone="warning" className="mt-6">
            В панели ещё нет ни одной учётной записи. Задайте переменные
            окружения ADMIN_LOGIN и ADMIN_PASSWORD и перезапустите панель —
            первый администратор будет создан из них.
          </Notice>
        )}
        {accounts === "weak" && (
          <Notice tone="warning" className="mt-6">
            Пароль в ADMIN_PASSWORD слишком короткий: нужно не меньше{" "}
            {MIN_PASSWORD_LENGTH} символов. Учётная запись не создана.
          </Notice>
        )}

        <SignInForm />
      </div>
    </main>
  );
}
