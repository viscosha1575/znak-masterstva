"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  followScroll,
  rememberPosition,
  rememberedPosition,
  scrollsInBox,
} from "@/lib/scroll";

/**
 * Where the page scrolls inside `#page` (touch screens, see lib/scroll.ts),
 * remembers how far each page was scrolled and puts it back after Back or
 * Forward — what the browser does by itself for a scrolled document. A link
 * to a new page still opens it at the top: Next.js scrolls its first element
 * into view, and that moves the box just as well.
 *
 * Must come after `#page` in the layout: its layout effect then runs after
 * Next.js's own scroll handling for the new page, and has the last word.
 */
export function ScrollMemory() {
  const pathname = usePathname();
  const back = useRef<{ path: string; y: number } | null>(null);

  useEffect(() => {
    const unfollow = followScroll((y) => {
      if (scrollsInBox()) rememberPosition(location.pathname, y);
    });
    // Read now: by the time the page has changed, the box may have moved —
    // clamped to the new page's height — and been remembered there.
    const onPop = () => {
      const path = location.pathname;
      back.current = scrollsInBox()
        ? { path, y: rememberedPosition(path) }
        : null;
    };
    window.addEventListener("popstate", onPop);
    return () => {
      unfollow();
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useLayoutEffect(() => {
    const target = back.current;
    if (!target || target.path !== pathname) return;
    back.current = null;
    const box = document.getElementById("page");
    if (box) box.scrollTop = target.y;
  }, [pathname]);

  return null;
}
