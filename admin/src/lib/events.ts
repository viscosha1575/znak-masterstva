import type { HistoryEvent } from "@/lib/applications";
import { statusTitle } from "@/lib/dictionaries";

/** One line of an application's history, in words. */
export function describeEvent(event: Pick<HistoryEvent, "type" | "data">): {
  title: string;
  /** Longer text that belongs with the event: a note, a reason. */
  body?: string;
} {
  const data = event.data;

  switch (event.type) {
    case "created":
      return { title: "Заявка подана" };
    case "edited": {
      const fields = Array.isArray(data.fields) ? data.fields.join(", ") : "";
      const from = typeof data.from === "string" ? data.from : "moderation";
      return {
        title:
          from === "moderation"
            ? "Участник изменил заявку"
            : `Участник изменил заявку — она вернулась на модерацию (была: ${statusTitle(from).toLowerCase()})`,
        body: fields ? `Изменено: ${fields}` : undefined,
      };
    }
    case "approved":
      return { title: "Заявка принята" };
    case "rejected":
      return {
        title: "Заявка отклонена",
        body: typeof data.reason === "string" ? data.reason : undefined,
      };
    case "returned":
      return { title: "Возвращена на модерацию" };
    case "note":
      return {
        title: "Заметка",
        body: typeof data.text === "string" ? data.text : undefined,
      };
    case "email":
      return data.sent
        ? { title: `Письмо участнику отправлено на ${String(data.to)}` }
        : {
            title: "Письмо участнику не отправлено",
            body: typeof data.error === "string" ? data.error : undefined,
          };
  }
}
