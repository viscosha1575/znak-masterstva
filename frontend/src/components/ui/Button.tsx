import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const base =
  "group/button relative inline-flex h-38 items-center justify-center overflow-clip rounded-button px-24 text-center text-white t-btn whitespace-nowrap transition-[background-color,border-color,transform] duration-300 ease-out-quart active:scale-[0.98] md:h-auto";

const variants = {
  /** Solid call to action; on desktop the mockup gives it a fixed width. */
  primary: "bg-violet hover:bg-[#7238ff] md:w-600 md:py-24",
  /** Quiet secondary action that sits on a glass card. */
  outline:
    "border border-lilac bg-violet/5 hover:border-white/80 hover:bg-violet/30 md:py-17",
};

type ButtonProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & Omit<ComponentProps<"button">, "className">)
);

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const content = (
    <>
      {/* Light sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-20 bg-linear-to-r from-transparent via-white/25 to-transparent opacity-0 transition-none group-hover/button:left-full group-hover/button:opacity-100 group-hover/button:transition-[left,opacity] group-hover/button:duration-700 group-hover/button:ease-out-quart"
      />
      <span className="relative">{children}</span>
    </>
  );

  const classes = cn(base, variants[variant], className);

  if (props.href !== undefined) {
    return (
      <Link className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}
