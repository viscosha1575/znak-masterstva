"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type QueryParamProps = {
  name: string;
  /** Called with the current value, and again whenever it changes. Pass a stable function (a state setter). */
  onChange: (value: string | undefined) => void;
};

function Reader({ name, onChange }: QueryParamProps) {
  const value = useSearchParams().get(name) ?? undefined;
  useEffect(() => onChange(value), [value, onChange]);
  return null;
}

/**
 * Reports a query-string parameter to its parent without rendering anything.
 *
 * Reading search params keeps whatever surrounds the read out of the
 * prerendered HTML. Isolating it here, behind its own Suspense boundary, lets
 * the page itself stay static and on screen before any JavaScript has loaded;
 * the parameter simply arrives a moment later, on the client.
 */
export function QueryParam(props: QueryParamProps) {
  return (
    <Suspense>
      <Reader {...props} />
    </Suspense>
  );
}
