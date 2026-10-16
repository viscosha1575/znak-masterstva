import mark from "@/assets/svg/logo-mark.svg";
import wordmark from "@/assets/svg/logo-text.svg";
import { cn } from "@/lib/cn";

/**
 * The Avito Uslugi logo. On desktop the header carries it smaller than the
 * footer (`small`); the mark and the wordmark keep their proportions either
 * way, so they are sized in shares of the box.
 */
export function Logo({ small }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "relative block h-22 w-156",
        small ? "md:h-32 md:w-235" : "md:h-45 md:w-329",
      )}
    >
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={mark.src}
        alt=""
        className="absolute left-0 top-0 h-auto w-[13.5%]"
      />
      <img
        src={wordmark.src}
        alt=""
        className="absolute right-0 top-0 h-auto w-[85.45%]"
      />
      {/* eslint-enable @next/next/no-img-element */}
      <span className="sr-only">Авито Услуги</span>
    </span>
  );
}
