"use client";

import { useEffect } from "react";
import { FINE_POINTER, MOTION_OK, whileMedia } from "@/lib/motion";
import { setSmoothScroll } from "@/lib/scroll";

/**
 * Inertial wheel scrolling — for a mouse or a trackpad only. A finger already
 * scrolls smoothly, and natively: on touch screens, under reduced motion and
 * on devices marked as slow (`data-lite`) the library is not even downloaded.
 *
 * It is driven by hand and only while the page is actually moving: with
 * nothing to animate no frame is requested, so an idle page costs nothing.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-lite")) return;

    return whileMedia(`${MOTION_OK} and ${FINE_POINTER}`, () => {
      let stop: (() => void) | undefined;
      let cancelled = false;

      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({
          autoRaf: false,
          lerp: 0.1,
          wheelMultiplier: 0.9,
          // A link clicked while the page still glides would otherwise
          // carry the glide over: Next.js puts the new page at its top and
          // Lenis then scrolls it on to where the old one was heading.
          stopInertiaOnNavigate: true,
        });
        // The same for Back and Forward, which are not clicks on a link.
        const onPop = () => {
          if (lenis.isStopped) return;
          lenis.stop();
          lenis.start();
        };
        window.addEventListener("popstate", onPop);

        let frame = 0;
        let idle = 0;
        const tick = (time: number) => {
          lenis.raf(time);
          idle = lenis.isScrolling ? 0 : idle + 1;
          frame = idle < 6 ? requestAnimationFrame(tick) : 0;
        };
        const wake = () => {
          idle = 0;
          frame ||= requestAnimationFrame(tick);
        };
        const off = lenis.on("virtual-scroll", wake);

        setSmoothScroll(lenis);
        stop = () => {
          off();
          window.removeEventListener("popstate", onPop);
          cancelAnimationFrame(frame);
          setSmoothScroll(null);
          lenis.destroy();
        };
      });

      return () => {
        cancelled = true;
        stop?.();
      };
    });
  }, []);

  return null;
}
