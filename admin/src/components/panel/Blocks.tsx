import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/*
 * The handful of blocks every page of the panel is put together from: a
 * number with its caption, a titled card, a list of captioned values.
 */

export function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

/** One number with a caption: the small cards in a row above a list. */
export function Stat({
  label,
  value,
  note,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  href?: string;
  tone?: string;
}) {
  const body = (
    <>
      <span className="block text-sm leading-none text-mute">{label}</span>
      <span
        className={cn(
          "mt-1.5 block text-2xl leading-tight font-bold tabular-nums",
          tone ?? "text-text",
        )}
      >
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
      {note && <span className="mt-1 block text-xs text-mute">{note}</span>}
    </>
  );
  const className = "card block px-5 py-[15px]";
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_20px_40px_rgb(112_144_176/0.16)] dark:hover:bg-subtle",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** A card with a heading, an optional line under it and something on the right. */
export function Panel({
  title,
  lead,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card p-[18px] md:p-6", className)}>
      {(title || aside) && (
        <div className="mb-[18px] flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg leading-snug font-bold text-ink md:text-xl">
                {title}
              </h2>
            )}
            {lead && <p className="mt-1 text-sm text-mute">{lead}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** A neutral pill for a figure in a card's corner: a total, "page 2 of 7". */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-subtle px-3 py-2 text-xs leading-none font-bold tracking-normal whitespace-nowrap text-ink uppercase tabular-nums">
      {children}
    </span>
  );
}

/** A wide card with a caption on the left and one big figure on the right. */
export function Highlight({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-between gap-x-6 gap-y-2 p-[22px] text-center md:flex-row md:p-7 md:text-left">
      <div>
        <p className="text-base font-medium text-soft md:text-lg">{label}</p>
        {note && <p className="mt-0.5 text-xs text-mute">{note}</p>}
      </div>
      <p className="text-2xl leading-none font-bold whitespace-nowrap text-accent tabular-nums md:text-3xl">
        {value}
      </p>
    </div>
  );
}

/** Captions with figures, one under another, ruled apart. */
export function Rows({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { key: string; label: ReactNode; value: ReactNode; note?: string }[];
  empty?: string;
}) {
  return (
    <section className="card p-[22px] md:p-7">
      <h2 className="mb-[22px] text-lg font-bold text-ink md:text-xl">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-mute">{empty}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex min-h-[60px] items-center justify-between gap-[18px] border-t border-rule py-2.5 first:min-h-[50px] first:border-0 first:pt-0"
            >
              <span className="min-w-0 text-sm font-medium break-words text-soft">
                {row.label}
                {row.note && (
                  <span className="block text-xs font-normal text-mute">
                    {row.note}
                  </span>
                )}
              </span>
              <span className="text-lg font-bold whitespace-nowrap text-accent tabular-nums md:text-xl">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A caption in small capitals over its value: the facts of a record. */
export function Fact({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="mb-1 text-xs font-semibold text-mute uppercase">
        {label}
      </dt>
      <dd className="text-sm font-semibold break-words text-ink">{children}</dd>
    </div>
  );
}

/** What a list says when there is nothing in it. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[1.25rem] border border-dashed border-line p-5 text-center text-sm text-mute">
      {children}
    </p>
  );
}

/** "Back" and "Forward" under a list. A missing address disables its button. */
export function Pager({
  previous,
  next,
  note,
  previousLabel = "Назад",
  nextLabel = "Вперёд",
}: {
  previous?: string;
  next?: string;
  note?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
}) {
  const disabled = buttonClass({
    size: "sm",
    className: "pointer-events-none opacity-50",
  });
  return (
    <nav
      aria-label="Страницы"
      className="mt-[18px] flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-mute">{note}</p>
      <div className="flex gap-3">
        {previous ? (
          <Link href={previous} className={buttonClass({ size: "sm" })}>
            {previousLabel}
          </Link>
        ) : (
          <span aria-disabled className={disabled}>
            {previousLabel}
          </span>
        )}
        {next ? (
          <Link href={next} className={buttonClass({ size: "sm" })}>
            {nextLabel}
          </Link>
        ) : (
          <span aria-disabled className={disabled}>
            {nextLabel}
          </span>
        )}
      </div>
    </nav>
  );
}
