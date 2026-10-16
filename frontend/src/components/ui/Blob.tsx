import type { StaticImageData } from "next/image";
import { cn } from "@/lib/cn";

type BlobProps = {
  src: StaticImageData;
  /** Position and size of the bounding box on the page. */
  frame: string;
  /** Rotation / mirroring of the artwork inside that box. */
  spin?: string;
  /** Un-rotated size of the artwork. Omit when it is not rotated and simply fills the frame. */
  box?: string | false;
  /** How far the blur bleeds past the artwork's own box. Softening (extra blur, opacity) goes here too. */
  bleed: string;
  /**
   * For light that is on the first screen: fetch it early on the layout that
   * shows it (the mobile and desktop layouts use different files, and the
   * hidden one must not be downloaded).
   */
  preload?: "mobile" | "desktop";
  className?: string;
};

const PRELOAD_MEDIA = {
  mobile: "(width < 48rem)",
  desktop: "(width >= 48rem)",
};

/**
 * A blurred light shape from the mockup. Figma exports these as an SVG whose
 * blur spills outside its layer bounds; rotated ones additionally sit inside a
 * larger bounding box — hence the nested boxes. A progressive blur does not
 * survive that export, so those shapes are pictures rebuilt on the same canvas
 * (see scripts/glow).
 *
 * It stands still, as in the mockup. A light that pulsed or drifted made the
 * browser redraw the page — and re-blur every glass card over or around it —
 * sixty times a second while nobody was doing anything.
 */
export function Blob({
  src,
  frame,
  spin,
  box,
  bleed,
  preload,
  className,
}: BlobProps) {
  const art = (
    <div className={cn("absolute", bleed)}>
      {preload && (
        <link
          rel="preload"
          as="image"
          href={src.src}
          media={PRELOAD_MEDIA[preload]}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src.src}
        alt=""
        loading="lazy"
        decoding="async"
        className="block size-full max-w-none"
      />
    </div>
  );

  const placed = box ? (
    <div className={cn("flex-none", spin)}>
      <div className={cn("relative", box)}>{art}</div>
    </div>
  ) : (
    art
  );

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute",
        box && "flex items-center justify-center",
        frame,
        className,
      )}
    >
      {placed}
    </div>
  );
}
