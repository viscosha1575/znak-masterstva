"use client";

import { useActionState, useState } from "react";
import {
  addNoteAction,
  type FormState,
} from "@/app/(panel)/applications/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

/** A note for colleagues. The applicant never sees it. */
export function NoteForm({ applicationId }: { applicationId: number }) {
  // Kept in state: React would clear the field even when the note is refused.
  const [text, setText] = useState("");
  const [state, action, pending] = useActionState(
    async (previous: FormState, data: FormData) => {
      const result = await addNoteAction(previous, data);
      if (!result.error) setText("");
      return result;
    },
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={applicationId} />
      <textarea
        name="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={2}
        required
        placeholder="Заметка для коллег — участник её не увидит"
        aria-label="Заметка"
        className="control resize-y"
      />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Button
        type="submit"
        variant="soft"
        size="sm"
        disabled={pending}
        className="self-end"
      >
        {pending ? "Сохраняем…" : "Добавить заметку"}
      </Button>
    </form>
  );
}
