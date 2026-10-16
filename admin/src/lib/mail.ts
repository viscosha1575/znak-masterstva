import "server-only";

import nodemailer from "nodemailer";
import type { Letter } from "@/lib/letters";

/*
 * Letters to applicants. Sending is optional: without SMTP_URL and MAIL_FROM
 * the panel works all the same and tells the moderator that no letter went out.
 *
 *   SMTP_URL       smtps://login:password@smtp.example.ru:465
 *   MAIL_FROM      Премия «Знак мастерства» <award@example.ru>
 *   MAIL_REPLY_TO  where replies should go, if not to MAIL_FROM (optional)
 *   SITE_URL       https://konkurs.example.ru — letters link to the account there (optional)
 */
export function mailConfigured() {
  return Boolean(process.env.SMTP_URL && process.env.MAIL_FROM);
}

/** The site's address without a trailing slash, if the panel was told it. */
export function siteUrl() {
  return process.env.SITE_URL?.replace(/\/+$/, "") || undefined;
}

/** The applicant's account on the site, for links in letters. */
export function accountUrl() {
  const site = siteUrl();
  return site ? `${site}/account` : undefined;
}

export async function sendLetter(
  to: string,
  letter: Letter,
): Promise<{ sent: true } | { sent: false; error: string }> {
  if (!mailConfigured()) return { sent: false, error: "почта не настроена" };

  try {
    const transport = nodemailer.createTransport(process.env.SMTP_URL!, {
      // A mail server that hangs must not hang the moderator's click with it.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      replyTo: process.env.MAIL_REPLY_TO || undefined,
      to,
      subject: letter.subject,
      text: letter.text,
    });
    return { sent: true };
  } catch (error) {
    console.error("Could not send a letter:", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "неизвестная ошибка",
    };
  }
}
