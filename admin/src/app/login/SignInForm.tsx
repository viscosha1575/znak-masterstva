"use client";

import { useActionState } from "react";
import { signIn } from "@/app/login/actions";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignInForm() {
  const [state, action] = useActionState(signIn, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <Field label="Логин">
        <input
          name="login"
          defaultValue={state.login}
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          className="control"
        />
      </Field>
      <Field label="Пароль">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="control"
        />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <SubmitButton
        variant="primary"
        pendingLabel="Входим…"
        className="mt-2 h-[50px] w-full"
      >
        Войти
      </SubmitButton>
    </form>
  );
}
