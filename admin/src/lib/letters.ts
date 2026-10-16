import { nominationTitle } from "@/lib/dictionaries";

export type Letter = { subject: string; text: string };

/**
 * The letter an applicant gets about a moderator's decision. No server-only
 * code here: the panel also shows it to the moderator before it is sent.
 *
 * `accountUrl` is the applicant's account on the site; without it the letter
 * simply carries no link.
 */
export function decisionLetter(
  application: { name: string; nomination: string },
  decision: "approved" | "rejected",
  options: { reason?: string; accountUrl?: string } = {},
): Letter {
  const nomination = nominationTitle(application.nomination);
  const link = (lead: string) =>
    options.accountUrl ? ["", `${lead}: ${options.accountUrl}`] : [];
  const signature = ["", "Команда премии «Знак мастерства»"];

  if (decision === "approved") {
    return {
      subject: "Ваша заявка на премию «Знак мастерства» принята",
      text: [
        `Здравствуйте, ${application.name}!`,
        "",
        `Ваша заявка в номинации «${nomination}» прошла модерацию и участвует в конкурсе премии «Знак мастерства».`,
        ...link("Статус заявки — в личном кабинете"),
        ...signature,
      ].join("\n"),
    };
  }

  return {
    subject: "Ваша заявка на премию «Знак мастерства» не прошла модерацию",
    text: [
      `Здравствуйте, ${application.name}!`,
      "",
      `Ваша заявка в номинации «${nomination}» не прошла модерацию.`,
      "",
      "Причина и рекомендации:",
      options.reason?.trim() || "…",
      "",
      "Вы можете доработать заявку и отправить её повторно.",
      ...link("Редактировать заявку — в личном кабинете"),
      ...signature,
    ].join("\n"),
  };
}
