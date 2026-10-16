"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { whenSeen } from "@/lib/motion";

type SeenProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** How far down the viewport the element's top must be: 0 is the top edge, 1 the bottom. */
  line?: number;
  "aria-hidden"?: boolean;
} & Record<`data-${string}`, string>;

/**
 * Marks its element with `data-seen` the first time it scrolls into view.
 * What happens then is up to the stylesheet: the element carries `data-await`
 * until that moment, and CSS holds an entrance back while it does.
 */
export function Seen({ as: Tag = "div", children, line, ...rest }: SeenProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return whenSeen(el, () => el.setAttribute("data-seen", ""), line);
  }, [line]);

  return (
    <Tag ref={ref} data-await="" {...rest}>
      {children}
    </Tag>
  );
}
