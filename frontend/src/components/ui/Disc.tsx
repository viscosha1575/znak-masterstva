import { ART } from "@/assets/art";
import { Picture } from "@/components/ui/Picture";
import { cn } from "@/lib/cn";

const FADE = {
  both: "disc-fade",
  phone: "max-md:disc-fade",
  desktop: "md:disc-fade",
  none: "",
};

type DiscProps = {
  /** Position and size of the bounding box of the turned disc. */
  frame: string;
  /** Mirroring and rotation — they decide which edge of the disc is lit. */
  spin: string;
  /** Size of the disc's own square, before it is turned. */
  box: string;
  /**
   * Where the far side of the disc fades out. Most discs in the mockups are
   * masked that way; a few are shown whole, and some only on one layout.
   */
  fade?: keyof typeof FADE;
  /** Rendered width per breakpoint, e.g. "(width < 48rem) 44vw, 28vw". */
  sizes?: string;
  preload?: boolean;
  className?: string;
};

/** The ribbed glass disc that sits behind headings and objects. */
export function Disc({
  frame,
  spin,
  box,
  fade = "both",
  sizes = "(width < 48rem) 44vw, 28vw",
  preload,
  className,
}: DiscProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute flex items-center justify-center",
        frame,
        className,
      )}
    >
      <div className={cn("flex-none", spin)}>
        <Picture
          art={ART.disc}
          sizes={sizes}
          preload={preload}
          className={cn("block max-w-none", box, FADE[fade])}
        />
      </div>
    </div>
  );
}
