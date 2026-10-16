import type { ReactNode } from "react";

/** A labelled form control with an optional hint underneath. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-auto flex-col gap-2">
      <span className="text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-mute">{hint}</span>}
    </label>
  );
}
