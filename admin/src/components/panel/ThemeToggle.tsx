"use client";

import { IoMdMoon, IoMdSunny } from "react-icons/io";
import { roundButton } from "@/components/panel/sections";

/*
 * Light by default; the choice is remembered in this browser. The attribute
 * on <html> is the state — the icons follow it through CSS, so the button
 * renders the same on the server and needs no effect to catch up.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme !== "dark";
    if (dark) root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("znak-theme", dark ? "dark" : "light");
    } catch {
      // Private mode: the choice lasts until the tab is closed.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Сменить тему"
      className={roundButton}
    >
      <IoMdMoon aria-hidden className="size-[18px] dark:hidden" />
      <IoMdSunny aria-hidden className="hidden size-[18px] dark:block" />
    </button>
  );
}
