import type { Metadata } from "next";
import { Fact, Panel } from "@/components/panel/Blocks";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { requireUser } from "@/lib/auth";
import { roleTitle } from "@/lib/dictionaries";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";

export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel>
        <h2 className="text-2xl leading-tight font-bold break-words text-ink md:text-4xl">
          {user.name}
        </h2>
        <dl className="mt-5 grid gap-4 rounded-[1.25rem] bg-subtle p-5 sm:grid-cols-2">
          <Fact label="Логин">{user.login}</Fact>
          <Fact label="Роль">{roleTitle(user.role)}</Fact>
        </dl>
      </Panel>
      <Panel title="Смена пароля" className="max-w-xl">
        <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
      </Panel>
    </div>
  );
}
