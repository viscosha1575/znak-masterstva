"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, SECTIONS } from "@/components/panel/sections";
import { cn } from "@/lib/cn";

/** The sections on a phone: a bar of icons along the bottom edge. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const sections = SECTIONS.filter((section) => isAdmin || !section.admin);

  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] z-30 rounded-3xl border-[1.5px] border-bar-line bg-bar px-2.5 py-2 shadow-[0_14px_34px_rgb(112_144_176/0.18)] backdrop-blur-[20px] md:hidden"
    >
      <ul className="flex justify-between gap-1">
        {sections.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center justify-center rounded-2xl transition-colors duration-200",
                  current
                    ? "bg-brand/10 text-accent dark:bg-white/12"
                    : "text-mute",
                )}
              >
                <Icon aria-hidden className="size-5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
