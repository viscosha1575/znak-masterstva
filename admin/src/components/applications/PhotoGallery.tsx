"use client";

import { useEffect, useRef, useState } from "react";

export type GalleryPhoto = {
  id: string;
  name: string;
  /** Size and dimensions, ready to show: "2,4 Мб · 4000 × 3000". */
  details: string;
  /** `false` for a file the panel could not decode: it can only be downloaded. */
  hasPreview: boolean;
};

const original = (id: string) => `/files/${id}?variant=original`;

/**
 * Thumbnails of an application's photos; a click opens them full-size. The
 * viewer is dark in both themes: a photo is judged against black.
 */
export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const viewable = photos.filter((photo) => photo.hasPreview);
  const [openId, setOpenId] = useState<string | null>(null);
  const index = viewable.findIndex((photo) => photo.id === openId);
  const current = index >= 0 ? viewable[index] : null;

  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (current && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!current && element.open) element.close();
  }, [current]);

  const step = (by: 1 | -1) => {
    if (index < 0) return;
    setOpenId(viewable[(index + by + viewable.length) % viewable.length].id);
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {photos.map((photo) => (
          <li key={photo.id}>
            {photo.hasPreview ? (
              <button
                type="button"
                onClick={() => setOpenId(photo.id)}
                aria-label={`Открыть фото ${photo.name}`}
                className="group block aspect-square w-full overflow-hidden rounded-2xl bg-subtle"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/files/${photo.id}?variant=thumb`}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-[scale,opacity] duration-300 ease-out group-hover:scale-105 group-hover:opacity-90"
                />
              </button>
            ) : (
              <a
                href={original(photo.id)}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-subtle p-3 text-center text-sm text-soft transition-colors hover:border-brand hover:text-accent"
              >
                <span className="line-clamp-2 break-all">{photo.name}</span>
                <span className="text-xs">Нет превью — скачать файл</span>
              </a>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpenId(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpenId(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        aria-label="Просмотр фото"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-[rgb(11_20_55/0.94)] p-0 text-white"
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
              <p className="min-w-0 flex-1">
                <span className="block truncate font-bold">{current.name}</span>
                <span className="block text-xs text-mute">
                  {index + 1} из {viewable.length} · {current.details}
                </span>
              </p>
              <a
                href={original(current.id)}
                className="shrink-0 rounded-xl px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Скачать оригинал
              </a>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Закрыть"
                data-autofocus
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* The empty space around the picture closes the viewer, like the backdrop would. */}
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16"
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpenId(null);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.id}
                src={`/files/${current.id}`}
                alt={current.name}
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
              {viewable.length > 1 && (
                <>
                  <Arrow side="left" onClick={() => step(-1)} />
                  <Arrow side="right" onClick={() => step(1)} />
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function Arrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Предыдущее фото" : "Следующее фото"}
      className={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand ${
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4"
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
        <path
          d={side === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
