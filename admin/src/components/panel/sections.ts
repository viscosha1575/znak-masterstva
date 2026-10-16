import type { IconType } from "react-icons";
import {
  MdBarChart,
  MdHome,
  MdLink,
  MdListAlt,
  MdManageAccounts,
  MdPeopleAlt,
  MdReceiptLong,
  MdSettings,
} from "react-icons/md";

export type Section = {
  href: string;
  label: string;
  icon: IconType;
  /** Shown to administrators only. */
  admin?: boolean;
};

/** The panel's sections, in the order the menus list them. */
export const SECTIONS: Section[] = [
  { href: "/", label: "Обзор", icon: MdHome },
  { href: "/applications", label: "Заявки", icon: MdListAlt },
  { href: "/statistics", label: "Статистика", icon: MdBarChart },
  { href: "/sessions", label: "Сессии", icon: MdPeopleAlt },
  { href: "/logs", label: "Логи", icon: MdReceiptLong },
  { href: "/utm", label: "UTM", icon: MdLink },
  { href: "/staff", label: "Сотрудники", icon: MdManageAccounts, admin: true },
  { href: "/settings", label: "Настройки", icon: MdSettings, admin: true },
];

export function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** What the bar at the top calls the page being looked at. */
export function pageTitle(pathname: string) {
  const application = /^\/applications\/(\d+)/.exec(pathname);
  if (application) return `Заявка № ${application[1]}`;
  const session = /^\/sessions\/(\d+)/.exec(pathname);
  if (session) return `Сессия № ${session[1]}`;
  if (pathname.startsWith("/profile")) return "Профиль";
  return (
    SECTIONS.find((section) => isCurrent(pathname, section.href))?.label ??
    "Админ-панель"
  );
}

/** The round white buttons at the right end of the top bar. */
export const roundButton =
  "grid size-12 shrink-0 place-items-center rounded-full bg-card text-mute shadow-float transition-colors duration-200 hover:text-accent dark:text-white";
