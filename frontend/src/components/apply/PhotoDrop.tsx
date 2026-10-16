"use client";

import { useEffect, useId, useMemo, useState, type DragEvent } from "react";
import uploadIcon from "@/assets/svg/upload.svg";
import { cn } from "@/lib/cn";

export const MAX_PHOTOS = 5;
const MAX_BYTES = 30 * 1024 * 1024;

/** A photo the application already has on the server, shown next to the new ones. */
export type StoredPhoto = { id: string; name: string; url: string };

type PhotoDropProps = {
  files: File[];
  onChange: (files: File[]) => void;
  /** When editing: photos saved earlier. They count towards the limit of five. */
  stored?: StoredPhoto[];
  onRemoveStored?: (id: string) => void;
};

const NO_PHOTOS: StoredPhoto[] = [];

/** Optional photo upload: click or drop up to five images, 30 MB each. */
export function PhotoDrop({
  files,
  onChange,
  stored = NO_PHOTOS,
  onRemoveStored,
}: PhotoDropProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const add = (incoming: FileList | null) => {
    if (!incoming) return;
    const images = Array.from(incoming).filter((file) =>
      file.type.startsWith("image/"),
    );
    const fitting = images.filter((file) => file.size <= MAX_BYTES);
    const room = MAX_PHOTOS - stored.length;
    const next = [...files, ...fitting].slice(0, Math.max(0, room));

    if (images.length < incoming.length) {
      setProblem("Можно добавить только изображения");
    } else if (fitting.length < images.length) {
      setProblem("Каждое фото должно быть не больше 30 Мб");
    } else if (files.length + fitting.length > room) {
      setProblem(`Можно добавить не больше ${MAX_PHOTOS} фото`);
    } else {
      setProblem(null);
    }
    onChange(next);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-121 cursor-pointer flex-col items-center rounded-[calc(var(--u)*12)] bg-field px-10 pb-16 pt-24 text-center text-mute transition-[background-color,box-shadow] duration-300 hover:bg-[#f1eefc] has-focus-visible:shadow-[inset_0_0_0_2px_var(--color-violet)] md:min-h-392 md:rounded-card md:px-30 md:pb-60 md:pt-70",
          dragging &&
            "bg-[#ebe4ff] shadow-[inset_0_0_0_2px_var(--color-violet)]",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            add(event.target.files);
            event.target.value = "";
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uploadIcon.src}
          alt=""
          className={cn(
            "h-auto w-29 transition-transform duration-500 ease-out-expo md:w-100",
            dragging && "-translate-y-4 scale-110",
          )}
        />
        <span className="mt-11 max-md:t-date md:mt-40 md:t-q">
          Добавьте фото работ, если хотите
        </span>
        <span className="mt-8 t-small md:mt-20 md:t-input">
          (1-5 шт.) до 30 Мб
        </span>
      </label>

      {stored.length + previews.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-8 md:mt-25 md:gap-25">
          {stored.map((photo) => (
            <Preview
              key={photo.id}
              url={photo.url}
              name={photo.name}
              onRemove={() => onRemoveStored?.(photo.id)}
            />
          ))}
          {previews.map(({ file, url }, index) => (
            <Preview
              key={url}
              url={url}
              name={file.name}
              onRemove={() => onChange(files.filter((_, i) => i !== index))}
            />
          ))}
        </ul>
      )}

      {problem && (
        <p role="alert" className="mt-6 text-danger t-small md:mt-15">
          {problem}
        </p>
      )}
    </div>
  );
}

function Preview({
  url,
  name,
  onRemove,
}: {
  url: string;
  name: string;
  onRemove: () => void;
}) {
  return (
    <li className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        className="size-58 rounded-[calc(var(--u)*8)] object-cover md:size-200 md:rounded-[calc(var(--u)*20)]"
      />
      <button
        type="button"
        aria-label={`Убрать фото ${name}`}
        // The statistics get the action, not the applicant's file name.
        data-track="Убрать фото"
        onClick={onRemove}
        className="absolute -right-4 -top-4 grid size-18 cursor-pointer place-items-center rounded-full bg-ink text-white transition-colors hover:bg-violet md:-right-12 md:-top-12 md:size-48"
      >
        <span
          aria-hidden
          className="relative block size-8 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:rotate-45 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-rotate-45 after:bg-current md:size-20 md:before:w-[2px] md:after:w-[2px]"
        />
      </button>
    </li>
  );
}
