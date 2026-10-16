import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 font-bold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  /** The one action a screen is for. */
  primary: "bg-brand text-white hover:bg-brand-hover",
  /** An action next to the main one. */
  secondary: "border border-line text-ink hover:bg-subtle",
  /** A quiet button on a card: pagers, "cancel". */
  light: "bg-subtle text-ink hover:bg-subtle-hover",
  /** A small action in a row of a table. */
  soft: "bg-brand-soft text-accent hover:bg-subtle-hover",
  ghost: "text-accent hover:bg-subtle",
  approve: "bg-ok text-white hover:brightness-95",
  danger: "bg-danger-soft text-danger-ink hover:brightness-95",
  /** Sits on the page itself, above the cards. */
  float: "bg-float text-float-ink hover:bg-float-hover",
};

const sizes = {
  md: "h-10 rounded-2xl px-4 text-base",
  sm: "h-10 rounded-[0.875rem] px-[1.125rem] text-sm",
  xs: "h-8 rounded-xl px-3 text-xs",
};

export type ButtonProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

export function buttonClass({
  variant = "light",
  size = "md",
  className,
}: Omit<ButtonProps, "children"> = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  children,
  variant,
  size,
  className,
  ...props
}: ButtonProps & Omit<ComponentProps<"button">, "className">) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant,
  size,
  className,
  ...props
}: ButtonProps & Omit<ComponentProps<typeof Link>, "className">) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
