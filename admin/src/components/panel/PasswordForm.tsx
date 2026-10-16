"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/(panel)/profile/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

export function PasswordForm({ minLength }: { minLength: number }) {
  // The fields clear themselves after every attempt, as password fields should.
  const [state, action, pending] = useActionState(changePasswordAction, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Текущий пароль">
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="control"
        />
      </Field>
      <Field label="Новый пароль" hint={`Не короче ${minLength} символов.`}>
        <input
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={minLength}
          required
          className="control"
        />
      </Field>
      <Field label="Новый пароль ещё раз">
        <input
          name="repeat"
          type="password"
          autoComplete="new-password"
          required
          className="control"
        />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.notice && <Notice tone="success">{state.notice}</Notice>}
      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Сохраняем…" : "Сменить пароль"}
      </Button>
    </form>
  );
}
