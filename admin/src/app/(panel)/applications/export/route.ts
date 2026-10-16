import type { NextRequest } from "next/server";
import { DEVICE_TITLES, sourceTitle, UTM_FIELDS } from "@/lib/analytics/types";
import { exportApplications } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { kindTitle, nominationTitle, statusTitle } from "@/lib/dictionaries";
import { formatShortDateTime, moscowDay } from "@/lib/format";
import { parseListParams } from "@/lib/list-params";

/** The applications under the list's current filter, as a spreadsheet. */
export async function GET(request: NextRequest) {
  await requireUser();
  const { filter } = parseListParams(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  const rows = exportApplications(filter).map((item) => [
    item.id,
    formatShortDateTime(item.createdAt),
    statusTitle(item.status),
    nominationTitle(item.nomination),
    item.name,
    item.email,
    item.phone,
    item.avitoUrl,
    item.city,
    kindTitle(item.kind),
    item.field,
    item.story,
    item.photoCount,
    item.consentPromo ? "да" : "нет",
    item.rejectReason,
    item.moderatedAt && formatShortDateTime(item.moderatedAt),
    item.moderatedBy,
    // Where the applicant came from; empty for visits that were not recorded.
    item.origin && sourceTitle(item.origin.source),
    ...UTM_FIELDS.map((field) => item.origin?.utm?.[field]),
    item.origin?.landing,
    item.origin && (DEVICE_TITLES[item.origin.device] ?? item.origin.device),
  ]);

  const csv = toCsv([
    [
      "№",
      "Подана",
      "Статус",
      "Номинация",
      "Имя и фамилия",
      "Почта",
      "Телефон",
      "Авито ID",
      "Город",
      "Тип",
      "Сфера деятельности",
      "Рассказ",
      "Фото",
      "Согласие на публикацию",
      "Причина отказа",
      "Решение принято",
      "Модератор",
      "Источник",
      ...UTM_FIELDS.map((field) => `utm_${field}`),
      "Первая страница",
      "Устройство",
    ],
    ...rows,
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zayavki-${moscowDay(new Date())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
