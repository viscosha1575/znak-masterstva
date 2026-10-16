"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/(panel)/applications/[id]/actions";
import { requireAdmin } from "@/lib/auth";
import { setAccepting } from "@/lib/settings";

export async function setAcceptingAction(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  const open = form.get("accepting") === "open";
  setAccepting(open);
  revalidatePath("/", "layout");
  return {
    notice: open
      ? "Приём заявок открыт"
      : "Приём заявок закрыт: сайт больше не принимает заявки и правки",
  };
}
