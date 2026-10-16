"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import chevron from "@/assets/svg/chevron-ink.svg";
import chevronMobile from "@/assets/svg/m-chevron-mute.svg";
import { Collapse } from "@/components/ui/Collapse";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
  /** A line under the label, in the open list. */
  description?: string;
  /** Shown but not selectable, with a short reason. */
  disabledReason?: string;
};

type SelectProps = {
  /** id of the visible label, for aria-labelledby. */
  labelId: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder: string;
  invalid?: boolean;
  /** id of a line that explains the current choice, for aria-describedby. */
  describedBy?: string;
};

/**
 * Inline select from the mockup: the field itself grows to reveal its options
 * instead of floating a menu over the form.
 */
export function Select({
  labelId,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  invalid,
  describedBy,
}: SelectProps) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const focusOption = (step: 1 | -1, from?: HTMLElement) => {
    const items = Array.from(
      root.current?.querySelectorAll<HTMLElement>(
        '[role="option"]:not([aria-disabled="true"])',
      ) ?? [],
    );
    if (items.length === 0) return;
    const index = from ? items.indexOf(from) : step === 1 ? -1 : 0;
    items[(index + step + items.length) % items.length].focus();
  };

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      // The list stops being inert on the next render.
      requestAnimationFrame(() =>
        focusOption(event.key === "ArrowDown" ? 1 : -1),
      );
    }
  };

  const onOptionKey = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(event.key === "ArrowDown" ? 1 : -1, event.currentTarget);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    } else if (event.key === "Escape") {
      setOpen(false);
      root.current?.querySelector("button")?.focus();
    }
  };

  return (
    <div
      ref={root}
      className={cn(
        "rounded-[calc(var(--u)*12)] bg-field transition-shadow duration-300 md:rounded-[calc(var(--u)*30)]",
        invalid && "shadow-[inset_0_0_0_1.5px_var(--color-danger)]",
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          onBlur?.();
        }
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKey}
        className="flex h-35 w-full cursor-pointer items-center justify-between rounded-[inherit] px-10 text-left t-input md:h-90 md:pl-34 md:pr-24"
      >
        <span className={selected ? "text-ink" : "text-mute"}>
          {selected?.label ?? placeholder}
        </span>
        <span className="flex h-10 w-14 shrink-0 items-center justify-center md:h-25 md:w-34">
          <picture
            className={cn(
              "flex-none transition-[rotate] duration-500 ease-out-expo",
              open ? "-rotate-90" : "rotate-90",
            )}
          >
            <source media="(width >= 48rem)" srcSet={chevron.src} />
            <img
              src={chevronMobile.src}
              alt=""
              className="h-auto w-10 max-w-none md:w-25"
            />
          </picture>
        </span>
      </button>

      <Collapse open={open} className="duration-500">
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="flex flex-col gap-8 px-10 pb-12 pt-12 t-input md:gap-20 md:px-34 md:pb-30 md:pt-30"
        >
          {options.map((option) => {
            const disabled = Boolean(option.disabledReason);
            return (
              <li
                key={option.value}
                role="option"
                tabIndex={disabled ? undefined : -1}
                aria-selected={option.value === value}
                aria-disabled={disabled}
                onKeyDown={onOptionKey}
                onClick={() => {
                  if (disabled) return;
                  onChange(option.value);
                  setOpen(false);
                  root.current?.querySelector("button")?.focus();
                }}
                className={cn(
                  "w-fit rounded-sm outline-offset-4 transition-colors duration-200",
                  disabled
                    ? "cursor-not-allowed text-mute"
                    : "cursor-pointer hover:text-violet",
                  option.value === value && "text-violet",
                )}
              >
                {option.label}
                {option.disabledReason && (
                  <span className="t-small"> — {option.disabledReason}</span>
                )}
                {option.description && (
                  <span className="mt-2 block text-ink/50 t-small md:mt-5">
                    {option.description}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Collapse>
    </div>
  );
}
