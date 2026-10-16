import type { CSSProperties, ElementType } from "react";
import { Seen } from "@/components/motion/Seen";
import { cn } from "@/lib/cn";
import { lines as markup, type PerLayout } from "@/lib/lines";

type LineRevealProps = {
  as?: ElementType;
  /**
   * The headline, with its line breaks and alternate letters marked as in
   * lib/lines.tsx — or `{ mobile, desktop }` where the two mockups differ.
   */
  text: string | PerLayout;
  /**
   * When the lines come in: `load` for the headline of a first screen,
   * `seen` for one further down, which waits to be scrolled to.
   */
  when?: "load" | "seen";
  id?: string;
  className?: string;
};

/** The lines of a headline on one layout: `|` breaks only on a phone, `^` only on desktop. */
function split(text: string, layout: keyof PerLayout) {
  const [here, elsewhere] = layout === "mobile" ? ["|", "^"] : ["^", "|"];
  return text.replaceAll(elsewhere, " ").replaceAll(here, "\n").split("\n");
}

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line, index) => (
    <span key={index} className="line-mask">
      <span style={{ "--i": index } as CSSProperties}>{markup(line)}</span>
    </span>
  ));
}

/**
 * A headline whose lines slide up, each from behind its own mask. Pure CSS
 * (see `.line-mask` in globals.css): the lines are known in advance — the
 * mockups set every break by hand — so nothing is measured or split in the
 * browser, and a first-screen headline plays on first paint without waiting
 * for JavaScript.
 *
 * The two layouts break a headline differently, so it is laid out twice and
 * each layout shows its own copy; the other is `display: none`, which also
 * keeps it from being read out twice.
 */
export function LineReveal({
  as = "h2",
  text,
  when = "seen",
  id,
  className,
}: LineRevealProps) {
  const copy =
    typeof text === "string" ? { mobile: text, desktop: text } : text;
  const mobile = split(copy.mobile, "mobile");
  const desktop = split(copy.desktop, "desktop");
  const same = mobile.join("\n") === desktop.join("\n");

  const content = same ? (
    <Lines lines={mobile} />
  ) : (
    <>
      <span className="contents md:hidden">
        <Lines lines={mobile} />
      </span>
      <span className="contents max-md:hidden">
        <Lines lines={desktop} />
      </span>
    </>
  );
  // A flex column, so the masks' negative margins cannot collapse into each
  // other and nudge the lines apart.
  const props = { id, className: cn("flex flex-col", className) };

  if (when === "load") {
    const Tag = as;
    return <Tag {...props}>{content}</Tag>;
  }
  return (
    <Seen as={as} line={0.88} {...props}>
      {content}
    </Seen>
  );
}
