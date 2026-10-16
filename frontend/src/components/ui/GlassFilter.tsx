"use client";

import { useEffect, useSyncExternalStore } from "react";
import map from "@/assets/images/glass-map.png";

/*
 * Refraction for glass surfaces — the part of Figma's Glass effect that plain
 * `backdrop-filter: blur()` cannot do.
 *
 * `backdrop-filter: url(#glass-refract)` runs what is behind a card through a
 * displacement map: neutral in the middle, pushing pixels inwards along a band
 * at the edges, so the background bends there like it does through the bevel
 * of thick glass.
 *
 * The map (assets/images/glass-map.png) is a small bitmap on purpose. Red
 * drives the horizontal shift, green the vertical one, 50% means "no shift".
 * A vector map is re-rasterised at full card size on every frame the backdrop
 * changes, which is far too slow next to moving light.
 *
 * It is switched on only where it works and is affordable:
 * - Chromium — the one engine that runs SVG filters inside backdrop-filter
 *   (no `@supports` query can tell: Safari parses the value, then ignores it);
 * - tablet-sized screens and up — phones keep the plain frosted blur and never
 *   download the map.
 */
const ROOMY = "(width >= 48rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(ROOMY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function capable() {
  const chromium = "userAgentData" in navigator || "chrome" in window;
  return chromium && window.matchMedia(ROOMY).matches;
}

export function GlassFilter() {
  const enabled = useSyncExternalStore(subscribe, capable, () => false);

  // The stylesheet switches over (`html[data-refract]`) only once the filter
  // below is in the document, so a card never points at a missing filter.
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.setAttribute("data-refract", "");
    return () => root.removeAttribute("data-refract");
  }, [enabled]);

  if (!enabled) return null;

  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        {/* Sizes are fractions of the card, so the bend scales with it. */}
        <filter
          id="glass-refract"
          x="0"
          y="0"
          width="1"
          height="1"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={map.src}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="0.07"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
