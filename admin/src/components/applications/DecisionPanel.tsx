"use client";

import { useActionState, useState } from "react";
import {
  decideAction,
  type FormState,
} from "@/app/(panel)/applications/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import type { Status } from "@/lib/dictionaries";
import { decisionLetter } from "@/lib/letters";

type DecisionPanelProps = {
  application: {
    id: number;
    name: string;
    email: string;
    nomination: string;
    status: Status;
  };
  /** Whether the panel can send letters at all. */
  mail: boolean;
  accountUrl?: string;
};

type Dialog = "approved" | "rejected" | null;

/** The moderator's buttons: accept, reject with a reason, or take a decision back. */
export function DecisionPanel({
  application,
  mail,
  accountUrl,
}: DecisionPanelProps) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  // A refused reason stops being news once the moderator starts rewriting it.
  const [refusalSeen, setRefusalSeen] = useState(false);
  // In state, like the reason: React clears uncontrolled fields after every
  // action, a refused one included.
  const [notify, setNotify] = useState(true);

  const [state, action, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await decideAction(previous, form);
      setRefusalSeen(false);
      // A refused reason keeps the dialog open; anything else is shown on the page.
      if (!(result.error && form.get("decision") === "rejected")) {
        setDialog(null);
        setReason("");
      }
      return result;
    },
    {},
  );

  const { status } = application;
  const hidden = (
    <>
      <input type="hidden" name="id" value={application.id} />
      <input type="hidden" name="expected" value={status} />
    </>
  );
  const letterNote = mail ? (
    <label className="flex items-start gap-2.5 text-sm font-medium text-ink">
      <input
        type="checkbox"
        name="notify"
        checked={notify}
        onChange={(event) => setNotify(event.target.checked)}
        className="mt-0.5 size-4 accent-brand"
      />
      <span>Отправить участнику письмо на {application.email}</span>
    </label>
  ) : (
    <Notice tone="warning">
      Отправка почты не настроена: участник письма не получит. Сообщите ему о
      решении сами — {application.email}.
    </Notice>
  );
  const letter =
    dialog && decisionLetter(application, dialog, { reason, accountUrl });

  return (
    <div className="flex flex-col gap-3">
      {status !== "approved" && (
        <Button
          variant="approve"
          disabled={pending}
          onClick={() => setDialog("approved")}
        >
          Принять заявку
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => setDialog("rejected")}
        >
          Отклонить
        </Button>
      )}
      {status !== "moderation" && (
        <form action={action}>
          {hidden}
          <input type="hidden" name="decision" value="moderation" />
          <Button
            type="submit"
            variant="secondary"
            disabled={pending}
            className="w-full"
          >
            Вернуть на модерацию
          </Button>
        </form>
      )}

      {!dialog && state.error && <Notice tone="error">{state.error}</Notice>}
      {state.warning && <Notice tone="warning">{state.warning}</Notice>}
      {state.notice && <Notice tone="success">{state.notice}</Notice>}

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog === "rejected" ? "Отклонить заявку" : "Принять заявку"}
      >
        <form action={action} className="flex flex-col gap-4">
          {hidden}
          <input type="hidden" name="decision" value={dialog ?? ""} />

          {dialog === "rejected" ? (
            <label className="flex cursor-auto flex-col gap-2">
              <span className="text-sm font-bold text-ink">
                Причина отказа и что стоит доработать
              </span>
              <textarea
                name="reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setRefusalSeen(true);
                }}
                rows={5}
                required
                data-autofocus
                className="control resize-y"
              />
            </label>
          ) : (
            <p className="text-sm text-soft">
              Заявка № {application.id} ({application.name}) пройдёт модерацию и
              будет участвовать в конкурсе.
            </p>
          )}

          {letterNote}
          {mail && letter && (
            <details className="rounded-2xl bg-subtle px-4 py-3 text-sm">
              <summary className="font-bold text-ink transition-colors hover:text-accent">
                Как будет выглядеть письмо
              </summary>
              <p className="mt-3 font-bold text-ink">{letter.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-soft">
                {letter.text}
              </p>
            </details>
          )}

          {dialog === "rejected" && state.error && !refusalSeen && (
            <Notice tone="error">{state.error}</Notice>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button onClick={() => setDialog(null)}>Отмена</Button>
            <Button
              type="submit"
              variant={dialog === "rejected" ? "danger" : "approve"}
              disabled={pending}
            >
              {pending
                ? "Сохраняем…"
                : dialog === "rejected"
                  ? "Отклонить"
                  : "Принять"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
