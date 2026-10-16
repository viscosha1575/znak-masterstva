"use client";

import { useActionState } from "react";
import { setAcceptingAction } from "@/app/(panel)/settings/actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export function AcceptingForm({ accepting }: { accepting: boolean }) {
  const [state, action, pending] = useActionState(setAcceptingAction, {});

  return (
    <form action={action} className="mt-5 flex flex-col items-start gap-3">
      <input
        type="hidden"
        name="accepting"
        value={accepting ? "closed" : "open"}
      />
      <Button
        type="submit"
        variant={accepting ? "danger" : "approve"}
        disabled={pending}
      >
        {accepting ? "Закрыть приём заявок" : "Открыть приём заявок"}
      </Button>
      {state.notice && <Notice tone="success">{state.notice}</Notice>}
    </form>
  );
}
