"use client";

import { useActionState, useState } from "react";
import { deleteAction } from "@/app/(panel)/applications/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";

/** Deletes the application for good, after a second look. Shown to administrators only. */
export function DeleteApplication({
  application,
}: {
  application: { id: number; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAction, {});

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Удалить заявку
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Удалить заявку?">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={application.id} />
          <p className="text-sm text-soft">
            Заявка № {application.id} «{application.name}» исчезнет вместе с
            фотографиями и историей — и из панели, и из личного кабинета
            участника. Вернуть её будет нельзя.
          </p>
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "Удаляем…" : "Удалить навсегда"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
