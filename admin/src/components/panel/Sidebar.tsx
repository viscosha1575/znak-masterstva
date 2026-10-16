"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, SECTIONS } from "@/components/panel/sections";
import { cn } from "@/lib/cn";

export type MenuProps = {
  /** Applications waiting for a decision. */
  waiting: number;
  isAdmin: boolean;
};

/** The brand and the list of sections: the fixed column on wide screens, the drawer on tablets. */
export function Menu({ waiting, isAdmin }: MenuProps) {
  const pathname = usePathname();
  const sections = SECTIONS.filter((section) => isAdmin || !section.admin);

  return (
    <div className="flex h-full flex-col px-4 pt-[25px]">
      <Link
        href="/"
        className="my-7 block px-2.5 text-[1.75rem] leading-[1.05] font-bold tracking-[-0.04em] text-ink"
      >
        Знак мастерства
      </Link>
      <div className="mb-5 h-px w-full bg-line" />

      <nav aria-label="Разделы" className="mt-2 pl-5">
        <ul>
          {sections.map(({ href, label, icon: Icon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className="group flex items-center py-[5px] pl-2.5"
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "mr-[18px] size-5 shrink-0 transition-colors duration-200",
                      current
                        ? "text-accent"
                        : "text-nav group-hover:text-accent",
                    )}
                  />
                  <span
                    className={cn(
                      "mr-auto text-base transition-colors duration-200",
                      current
                        ? "font-bold text-nav-active"
                        : "text-nav group-hover:text-nav-active",
                    )}
                  >
                    {label}
                  </span>
                  {href === "/applications" && waiting > 0 && (
                    <span
                      title="Ждут решения"
                      className="mr-3 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs leading-none font-bold tracking-normal text-white"
                    >
                      {waiting}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "h-9 w-1 rounded-[5px]",
                      current ? "bg-brand" : "bg-transparent",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
