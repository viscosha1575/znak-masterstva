import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CollapseProps = {
  open: boolean;
  children: ReactNode;
  id?: string;
  role?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * Smoothly opens and closes its content. The height is animated with a CSS
 * grid row (0fr ↔ 1fr), so it needs no measuring and no animation library,
 * and the content stays in the page — search engines can read a closed
 * answer. While closed it is `inert`: not focusable, hidden from assistive
 * technology.
 */
export function Collapse({
  open,
  children,
  className,
  ...rest
}: CollapseProps) {
  return (
    <div
      {...rest}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-600 ease-out-expo",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-clip">{children}</div>
    </div>
  );
}
