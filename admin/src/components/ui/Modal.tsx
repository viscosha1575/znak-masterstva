"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MdClose } from "react-icons/md";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

/** A modal window on the native <dialog>: focus trap, Esc and backdrop come with it. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // The browser focuses the first control, which is the close button.
      // A dialog that asks for input should start in its first field instead.
      element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // A click that lands on the dialog itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[min(34rem,calc(100vw-1rem))] rounded-[1.25rem] border border-line bg-card p-0 text-text shadow-[0_18px_40px_rgb(112_144_176/0.2)] md:rounded-[1.875rem] dark:shadow-none",
        className,
      )}
    >
      {open && (
        <div className="p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl leading-tight font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={onClose}
              className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-subtle-hover"
            >
              <MdClose className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
