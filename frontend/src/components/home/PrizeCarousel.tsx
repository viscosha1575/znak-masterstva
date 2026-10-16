"use client";

import { useEffect, useRef, useState } from "react";
import arrow from "@/assets/svg/m-arrow.svg";
import { PRIZES, PrizeCard } from "@/components/sections/Prizes";
import { cn } from "@/lib/cn";

/**
 * The prizes of the phone layout, one card at a time: swipe, or step with the
 * arrows. It is a plain scrolling row with scroll snapping, so the browser does
 * the dragging and the momentum; the arrows only ask it to scroll.
 */
export function PrizeCarousel({ className }: { className?: string }) {
  const row = useRef<HTMLDivElement>(null);
  // Which ends of the row can still be scrolled towards.
  const [more, setMore] = useState({ back: false, forward: true });

  useEffect(() => {
    const el = row.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      // Some slack: a snap may come to rest a fraction of a pixel short.
      const slack = el.clientWidth * 0.1;
      setMore({
        back: el.scrollLeft > slack,
        forward: el.scrollLeft < max - slack,
      });
    };
    el.addEventListener("scroll", update, { passive: true });
    // Also reports once on its own, right after it starts observing.
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const el = row.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const gap =
      parseFloat(getComputedStyle(card.parentElement!).columnGap) || 0;
    el.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={row}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* As wide as its cards plus the side gutters, so the last card can be scrolled clear of the edge. */}
        <ul aria-label="Награды" className="flex w-max gap-5 px-16">
          {PRIZES.map((prize) => (
            <li key={prize.id} className="w-308 flex-none snap-center">
              <PrizeCard prize={prize} variant="carousel" />
            </li>
          ))}
        </ul>
      </div>

      {([-1, 1] as const).map((direction) => {
        const shown = direction === -1 ? more.back : more.forward;
        return (
          <button
            key={direction}
            type="button"
            aria-label={
              direction === -1 ? "Предыдущая награда" : "Следующая награда"
            }
            tabIndex={shown ? 0 : -1}
            aria-hidden={!shown}
            onClick={() => step(direction)}
            className={cn(
              "absolute top-74 z-10 size-32 cursor-pointer rounded-full transition-[opacity,scale] duration-300 ease-out-quart active:scale-90",
              direction === -1 ? "left-6" : "right-6",
              !shown && "pointer-events-none opacity-0",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={arrow.src}
              alt=""
              className={cn("block size-full", direction === 1 && "rotate-180")}
            />
          </button>
        );
      })}
    </div>
  );
}
