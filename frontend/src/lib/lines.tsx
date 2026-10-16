import { Fragment, type ReactNode } from "react";

const MARK = /(\n|\||\^|\{[^}]+\}|\[[^\]]+\])/;

/** Copy that reads differently on the mobile and the desktop mockup. */
export type PerLayout = { mobile: string; desktop: string };

/**
 * Renders copy with the line breaks set by hand in the mockups.
 *
 * The layout scales as one piece (see `--u` in globals.css), so text wraps the
 * same way at every screen size within a breakpoint. That makes it safe to
 * reproduce the designers' breaks literally, per layout:
 *
 *   "\n"  break on both layouts
 *   "|"   break on the mobile layout only
 *   "^"   break on the desktop layout only
 *
 * A break that is off on a layout is rendered as an ordinary space there.
 *
 * Headlines of the mobile mockup also pick out single letters in the
 * typeface's alternate forms:
 *
 *   "{а}"  stylistic sets 6 and 7 — the looped а, е, о, с and the notched р
 *   "[р]"  stylistic set 7 alone — the plain slanted р
 *
 * On desktop, where the mockup has none, the letters are set as usual.
 *
 * Where the two mockups word something differently, pass both versions as
 * `{ mobile, desktop }`; each is shown on its own layout only.
 */
export function lines(text: string | PerLayout): ReactNode {
  if (typeof text !== "string") {
    return (
      <>
        <span className="md:hidden">{lines(text.mobile)}</span>
        <span className="max-md:hidden">{lines(text.desktop)}</span>
      </>
    );
  }

  return text.split(MARK).map((part, index) => {
    if (part === "\n") return <br key={index} />;
    if (part === "|") {
      return (
        <Fragment key={index}>
          <br className="md:hidden" />
          <span className="max-md:hidden"> </span>
        </Fragment>
      );
    }
    if (part === "^") {
      return (
        <Fragment key={index}>
          <br className="max-md:hidden" />
          <span className="md:hidden"> </span>
        </Fragment>
      );
    }
    if (part.length > 2 && (part[0] === "{" || part[0] === "[")) {
      return (
        <span key={index} className={part[0] === "{" ? "alt-6" : "alt-7"}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
