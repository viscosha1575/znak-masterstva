"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { MdLogout, MdPerson } from "react-icons/md";
import { signOut } from "@/app/login/actions";
import { pageTitle, roundButton } from "@/components/panel/sections";
import { Menu, type MenuProps } from "@/components/panel/Sidebar";
import { ThemeToggle } from "@/components/panel/ThemeToggle";
import { cn } from "@/lib/cn";

type NavbarProps = MenuProps & {
  user: { name: string; role: string };
};

/**
 * The bar at the top of every page: what is being looked at on the left, the
 * theme switch and the account on the right. It floats over the content,
 * which scrolls underneath its frosted glass.
 */
export function Navbar({ user, ...menu }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-2 top-2 z-30 flex min-h-[60px] items-center gap-3 rounded-2xl bg-page/20 px-2.5 py-2 backdrop-blur-[20px] md:inset-x-5 md:top-4 md:min-h-[75px] xl:left-[320px] xl:right-[30px] xl:top-5 xl:pl-3 dark:bg-page/50">
      <Drawer {...menu} />
      <h1 className="min-w-0 flex-1 truncate text-[1.625rem] leading-tight font-bold text-ink md:text-3xl xl:text-[2.125rem]">
        {pageTitle(pathname)}
      </h1>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <Account user={user} current={pathname === "/profile"} />
      </div>
    </header>
  );
}

/** The sections on a tablet, where there is room for neither the column nor the bottom bar. */
function Drawer(menu: MenuProps) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);

  // Following a link closes the drawer.
  useEffect(() => dialog.current?.close(), [pathname]);

  return (
    <div className="hidden md:block xl:hidden">
      <button
        type="button"
        aria-label="Разделы"
        onClick={() => dialog.current?.showModal()}
        className="grid size-10 place-items-center rounded-full text-nav transition-colors hover:text-accent"
      >
        <IoMenuOutline aria-hidden className="size-6" />
      </button>
      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        className="m-0 h-dvh max-h-none w-80 max-w-[88vw] bg-card p-0 text-text"
      >
        <Menu {...menu} />
      </dialog>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function Account({
  user,
  current,
}: {
  user: NavbarProps["user"];
  current: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Closes on navigation: the address is the state the menu was opened under.
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const item =
    "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink transition-colors hover:bg-subtle";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={`Учётная запись: ${user.name}`}
        aria-expanded={open}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen(!open);
        }}
        className={cn(
          roundButton,
          "text-sm font-bold tracking-normal text-ink dark:text-white",
          current && "ring-2 ring-brand",
        )}
      >
        {initials(user.name) || <MdPerson aria-hidden className="size-5" />}
      </button>
      {open && (
        <div className="card absolute right-0 top-[calc(100%+0.625rem)] w-64 p-2 shadow-float">
          <div className="px-3 pb-2.5 pt-2">
            <p className="truncate font-bold text-ink">{user.name}</p>
            <p className="truncate text-xs text-mute">{user.role}</p>
          </div>
          <div className="mx-3 mb-1.5 h-px bg-line" />
          <Link href="/profile" className={item}>
            <MdPerson aria-hidden className="size-5 text-mute" />
            Профиль
          </Link>
          <form action={signOut}>
            <button type="submit" className={item}>
              <MdLogout aria-hidden className="size-5 text-mute" />
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
