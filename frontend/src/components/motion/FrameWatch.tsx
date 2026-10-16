"use client";

import { useEffect } from "react";
import { followScroll } from "@/lib/scroll";

/** A frame slower than this (ms) counts against the device: under ~30 fps. */
const SLOW_FRAME = 34;
/** Length of one measuring window, in ms of measured frames. */
const WINDOW = 2500;
/**
 * This many windows without a complaint and the device is trusted: no more
 * measuring. Kept short — while it measures, its frame loop has the page
 * build a frame on every refresh of the screen.
 */
const TRUST = 3;

/**
 * Safety valve for devices that cannot keep up. The page starts in the light
 * mode on its own where the device says it is weak (the boot script in
 * app/layout.tsx); this catches the rest by watching frames. If a quarter of
 * them are slow for two measuring windows in a row, the most expensive thing
 * on these pages goes: the blur behind the glass (`data-lite`, see
 * globals.css). Content and entrances are never touched.
 *
 * Frames are only counted while the page has a reason to produce them: for
 * a few seconds after it has loaded, and while it is being scrolled. An idle
 * page is left idle — counting frames would itself keep it busy, and for the
 * same reason a device that has done well for long enough, or has been
 * switched to the light mode, is not measured any more.
 */
export function FrameWatch() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-lite")) return;

    let frames = 0;
    let slow = 0;
    let elapsed = 0;
    let strikes = 0;
    let last = 0;
    let until = 0;
    let frame = 0;
    let clean = 0;
    let done = false;

    const verdict = () => {
      const struggling = slow / frames > 0.25;
      strikes = struggling ? strikes + 1 : 0;
      clean = struggling ? 0 : clean + 1;
      frames = slow = elapsed = 0;
      if (clean >= TRUST) return finish();
      if (strikes < 2) return;
      root.setAttribute("data-lite", "");
      finish();
    };

    const sample = (now: number) => {
      const delta = last ? now - last : 0;
      // Long gaps are a hidden tab or a debugger pause, not a slow device.
      if (delta && delta < 400 && !document.hidden) {
        frames += 1;
        if (delta > SLOW_FRAME) slow += 1;
        elapsed += delta;
        if (elapsed >= WINDOW) verdict();
      }
      last = now;
      frame = !done && now < until ? requestAnimationFrame(sample) : 0;
      if (!frame) last = 0;
    };

    const watch = (ms: number) => {
      until = Math.max(until, performance.now() + ms);
      frame ||= requestAnimationFrame(sample);
    };

    const settle = setTimeout(() => watch(6000), 3000); // skip load and hydration
    const unfollow = followScroll(() => watch(400));
    const finish = () => {
      done = true;
      unfollow();
    };

    return () => {
      clearTimeout(settle);
      cancelAnimationFrame(frame);
      unfollow();
    };
  }, []);

  return null;
}
