/*
 * The fixed lists an application picks from. The site has its own copies —
 * nominations in frontend/src/content/nominations.ts (with the full texts),
 * types in frontend/src/components/apply/ApplyForm.tsx. A value added there
 * has to be added here too, or the API will turn such applications away.
 */

export const NOMINATIONS = [
  { id: "stories", title: "Хорошие истории" },
  { id: "start", title: "Яркий старт" },
  { id: "creative", title: "Креативная услуга" },
  { id: "stable", title: "Дело, которому доверяют" },
  { id: "level-up", title: "На уровень выше" },
  { id: "profile", title: "Профиль в деталях" },
] as const;

export const KINDS = [
  { id: "private", title: "Частный исполнитель" },
  { id: "company", title: "Компания" },
] as const;

export const STATUSES = [
  { id: "moderation", title: "На модерации" },
  { id: "approved", title: "Принята" },
  { id: "rejected", title: "Отклонена" },
] as const;

export type Status = (typeof STATUSES)[number]["id"];

export const ROLES = [
  { id: "moderator", title: "Модератор" },
  { id: "admin", title: "Администратор" },
] as const;

export type Role = (typeof ROLES)[number]["id"];

function titleOf(list: readonly { id: string; title: string }[], id: string) {
  return list.find((item) => item.id === id)?.title ?? id;
}

export const nominationTitle = (id: string) => titleOf(NOMINATIONS, id);
export const kindTitle = (id: string) => titleOf(KINDS, id);
export const statusTitle = (id: string) => titleOf(STATUSES, id);
export const roleTitle = (id: string) => titleOf(ROLES, id);

/** One participant may enter at most two nominations. */
export const MAX_APPLICATIONS = 2;

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 30 * 1024 * 1024;
