"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { listen, openPage } from "@/lib/analytics";

/** Reports page views, clicks and scroll depth for the whole site (lib/analytics.ts). */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => listen(), []);
  useEffect(() => openPage(pathname), [pathname]);

  return null;
}
