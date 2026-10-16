import { getImageProps } from "next/image";
import type { Art } from "@/assets/art";

/** Below this width the phone cut of an image is used. */
const PHONE = "(width < 40rem)";
const NOT_PHONE = "(width >= 40rem)";

type PictureProps = {
  art: Art;
  /** Rendered width per breakpoint, as for any responsive image. */
  sizes: string;
  alt?: string;
  quality?: number;
  /** For the image that is the first thing on screen: fetch it early, at high priority. */
  preload?: boolean;
  className?: string;
  "aria-hidden"?: boolean;
};

/**
 * Responsive image, with a separate source file for phones where the art has
 * one. Both cuts still go through the Next image optimizer, so each gets its
 * own AVIF/WebP ladder; the browser downloads exactly one of them.
 */
export function Picture({
  art,
  sizes,
  alt = "",
  quality,
  preload = false,
  className,
  ...rest
}: PictureProps) {
  const common = { alt, sizes, quality };
  const {
    props: { srcSet: full, ...img },
  } = getImageProps({
    ...common,
    src: art.src,
    loading: preload ? "eager" : "lazy",
    fetchPriority: preload ? "high" : undefined,
  });
  const phone = art.phone
    ? getImageProps({ ...common, src: art.phone }).props.srcSet
    : undefined;

  return (
    <>
      {preload && (
        <>
          {phone && (
            <link
              rel="preload"
              as="image"
              media={PHONE}
              imageSrcSet={phone}
              imageSizes={sizes}
              fetchPriority="high"
            />
          )}
          <link
            rel="preload"
            as="image"
            media={phone ? NOT_PHONE : undefined}
            imageSrcSet={full}
            imageSizes={sizes}
            fetchPriority="high"
          />
        </>
      )}
      {/* `contents`: the <img> is laid out as if the wrapper were not there. */}
      <picture className="contents">
        {phone && <source media={PHONE} srcSet={phone} sizes={sizes} />}
        <img {...img} {...rest} srcSet={full} alt={alt} className={className} />
      </picture>
    </>
  );
}
