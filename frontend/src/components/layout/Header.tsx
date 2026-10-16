"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import burger from "@/assets/svg/burger.svg";
import { Logo } from "@/components/ui/Logo";
import { NAV } from "@/content/nav";
import { cn } from "@/lib/cn";
import { followScroll, lockScroll, scrollPosition } from "@/lib/scroll";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Slide away as soon as the page is read down — the header lies over the
  // copy — and come back on the first scroll up.
  useEffect(() => {
    let last = scrollPosition();
    return followScroll((now) => {
      setHidden(now > last && now > 0);
      last = now;
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    lockScroll(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-(--header-h) rounded-b-[calc(var(--u)*20)] bg-white transition-transform duration-500 ease-out-expo md:rounded-b-[calc(var(--u)*50)]",
          hidden && !open && "-translate-y-full",
        )}
      >
        <div className="relative mx-auto h-full max-w-(--frame)">
          {/*
           * On desktop the mockup lines the burger up with the top of the
           * logo, not the middle of the bar. The client asked for it a fifth
           * smaller than drawn (42 → 33.5 wide). It stays on the copy's left
           * edge and keeps the drawn one's middle, so its top comes down by
           * half the height it lost.
           */}
          <div className="absolute inset-y-0 left-14 flex items-center md:left-104 md:items-start md:pt-21.5">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((value) => !value)}
              className="group relative grid cursor-pointer place-items-center p-15 md:p-16"
            >
              {/* The phone mockup draws the bars thinner and in the dark violet. */}
              <span
                aria-hidden
                className={cn(
                  "relative block h-12 w-15 translate-y-1 transition-[opacity,scale,rotate] duration-500 ease-out-expo md:hidden",
                  open && "scale-50 rotate-90 opacity-0",
                )}
              >
                <i className="absolute left-0 top-0 h-2 w-full rounded-full bg-grape" />
                <i className="absolute left-0 top-5 h-2 w-full rounded-full bg-grape" />
                <i className="absolute left-0 top-10 h-2 w-full rounded-full bg-grape" />
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={burger.src}
                alt=""
                className={cn(
                  "h-auto w-33.5 transition-[opacity,scale,rotate] duration-500 ease-out-expo group-hover:scale-x-110 max-md:hidden",
                  open && "scale-50 rotate-90 opacity-0",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute grid size-15 place-items-center transition-[opacity,scale,rotate] duration-500 ease-out-expo max-md:translate-y-1 md:size-33.5",
                  !open && "scale-50 -rotate-90 opacity-0",
                )}
              >
                <i className="absolute h-[max(2px,calc(var(--u)*5))] w-full rotate-45 rounded-full bg-grape md:h-[max(2px,calc(var(--u)*4))] md:bg-violet-deep" />
                <i className="absolute h-[max(2px,calc(var(--u)*5))] w-full -rotate-45 rounded-full bg-grape md:h-[max(2px,calc(var(--u)*4))] md:bg-violet-deep" />
              </span>
            </button>
          </div>

          <Link
            href="/"
            aria-label="Авито Услуги — на главную"
            onClick={() => setOpen(false)}
            className="absolute left-1/2 top-19 -translate-x-1/2 md:left-auto md:right-120 md:top-35 md:translate-x-0"
          >
            <Logo small />
          </Link>
        </div>
      </header>

      {/*
       * The menu stays mounted and is opened with CSS alone: the panel is
       * unclipped from the top and each link rises out of its own mask, one
       * after another. Closed, it is invisible and `inert`.
       *
       * It starts behind the header, not below it: the header's bottom
       * corners are rounded, and the page must not show through.
       */}
      <nav
        id="site-menu"
        aria-label="Основная навигация"
        data-lenis-prevent
        inert={!open}
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto bg-ink transition-[clip-path,visibility] duration-700 ease-out-expo",
          open
            ? "visible [clip-path:inset(0)]"
            : "invisible [clip-path:inset(0_0_100%_0)]",
        )}
      >
        {/* The one light that moves: only while the menu is open, over a solid background. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1/4 -top-1/4 size-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgb(98_32_243/0.55),rgb(169_29_212/0.18)_55%,transparent)] ambient-sway [--amb-time:9s]"
          style={open ? undefined : { animationPlayState: "paused" }}
        />
        <ul className="relative mx-auto flex min-h-full max-w-(--frame) flex-col justify-center gap-18 px-16 pb-40 pt-96 md:gap-28 md:px-120 md:pb-80 md:pt-206">
          {NAV.map((item, index) => {
            const active = item.href === pathname;
            return (
              <li key={item.href} className="overflow-clip py-4">
                <div
                  className={cn(
                    "transition-[translate] duration-800 ease-out-expo",
                    open ? "translate-y-0" : "translate-y-[110%]",
                  )}
                  style={{
                    transitionDelay: open ? `${120 + index * 60}ms` : "0ms",
                  }}
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "inline-block t-h2 transition-[color,translate] duration-500 ease-out-expo hover:translate-x-12 md:hover:translate-x-24",
                      active ? "text-white" : "text-mute hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
