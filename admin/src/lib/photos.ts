import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebStream } from "node:stream/web";
import sharp from "sharp";
import { all, get, now, run, uploadsDir } from "@/lib/db";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "@/lib/dictionaries";

export type Photo = {
  id: string;
  applicationId: number;
  name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  /** `false` when the image could not be decoded: there is only the original to download. */
  hasPreview: boolean;
};

type PhotoRow = {
  id: string;
  application_id: number;
  name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  has_preview: number;
};

function toPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    mime: row.mime,
    size: row.size,
    width: row.width,
    height: row.height,
    hasPreview: row.has_preview === 1,
  };
}

export function listPhotos(applicationId: number) {
  return all<PhotoRow>(
    "SELECT * FROM photos WHERE application_id = :applicationId ORDER BY created_at, id",
    { applicationId },
  ).map(toPhoto);
}

export function findPhoto(id: string) {
  const row = get<PhotoRow>("SELECT * FROM photos WHERE id = :id", { id });
  return row && toPhoto(row);
}

/*
 * Files on disk. Nothing the uploader controls ends up in a path: the folder
 * is the application's number, the file name is an id generated here.
 */
export type Variant = "original" | "preview" | "thumb";

function folder(applicationId: number) {
  return path.join(uploadsDir(), String(applicationId));
}

export function photoFile(photo: Photo, variant: Variant) {
  const suffix = variant === "original" ? "" : `.${variant}.webp`;
  return path.join(folder(photo.applicationId), `${photo.id}${suffix}`);
}

/* ---------- Upload ---------- */

/** What the file really is, judged by its first bytes — never by its name or declared type. */
function sniff(head: Buffer) {
  const ascii = (start: number, end: number) =>
    head.subarray(start, end).toString("latin1");

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return "image/png";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "II*\0" || ascii(0, 4) === "MM\0*") return "image/tiff";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (/^(hei[cxms]|hev[cx]|mif1|msf1)$/.test(brand)) return "image/heic";
  }
  return null;
}

// A file of 30 MB can unpack into gigabytes of pixels. Past this size the
// photo is kept as it is, without previews, rather than decoded.
const DECODE = { limitInputPixels: 100_000_000 };

export class UploadError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function cleanName(name: string) {
  const cleaned = name
    .normalize("NFC")
    // Path separators and control characters have no place in a file name.
    .replace(/[\\/\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(-150);
  return cleaned || "photo";
}

/**
 * Stores one uploaded photo: streams it to disk (never holding the whole file
 * in memory), checks that it is an image, and renders the two smaller
 * versions the panel shows.
 */
export async function storePhoto(
  applicationId: number,
  body: ReadableStream<Uint8Array>,
  fileName: string,
): Promise<Photo> {
  const id = randomUUID();
  const dir = folder(applicationId);
  await mkdir(dir, { recursive: true });
  const partial = path.join(dir, `${id}.part`);
  const original = path.join(dir, id);
  const preview = path.join(dir, `${id}.preview.webp`);
  const thumb = path.join(dir, `${id}.thumb.webp`);
  const discard = () =>
    Promise.all(
      [partial, original, preview, thumb].map((file) =>
        rm(file, { force: true }),
      ),
    );

  try {
    let received = 0;
    const meter = new Transform({
      transform(chunk: Buffer, _encoding, done) {
        received += chunk.length;
        if (received > MAX_PHOTO_BYTES) {
          done(new UploadError(413, "Каждое фото должно быть не больше 30 Мб"));
        } else {
          done(null, chunk);
        }
      },
    });
    try {
      await pipeline(
        Readable.fromWeb(body as NodeWebStream<Uint8Array>),
        meter,
        createWriteStream(partial),
      );
    } catch (error) {
      if (error instanceof UploadError) throw error;
      // The connection dropped half-way: nothing to keep, nothing to log.
      throw new UploadError(
        400,
        "Файл не получен полностью. Попробуйте ещё раз",
      );
    }

    const handle = await open(partial);
    const head = Buffer.alloc(16);
    await handle.read(head, 0, head.length, 0);
    await handle.close();

    const mime = sniff(head);
    if (!mime) {
      throw new UploadError(415, "Можно добавить только изображения");
    }
    await rename(partial, original);

    // Re-encoding drops metadata (the camera's GPS position among it) and
    // proves the file decodes. Formats sharp cannot read keep the original only.
    let size: { width: number; height: number } | null = null;
    try {
      const rendered = await sharp(original, DECODE)
        .rotate()
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(preview);
      await sharp(original, DECODE)
        .rotate()
        .resize(480, 480, { fit: "cover" })
        .webp({ quality: 76 })
        .toFile(thumb);
      const full = await sharp(original, DECODE).metadata();
      const turned = (full.orientation ?? 1) >= 5;
      size = full.width
        ? {
            width: turned ? full.height : full.width,
            height: turned ? full.width : full.height,
          }
        : { width: rendered.width, height: rendered.height };
    } catch {
      await Promise.all(
        [preview, thumb].map((file) => rm(file, { force: true })),
      );
    }

    // The limit is checked in the same statement that inserts, so two uploads
    // racing for the last slot cannot both win.
    const { changes } = run(
      `INSERT INTO photos (id, application_id, name, mime, size, width, height, has_preview, created_at)
       SELECT :id, :applicationId, :name, :mime, :size, :width, :height, :hasPreview, :now
       WHERE (SELECT COUNT(*) FROM photos WHERE application_id = :applicationId) < :max`,
      {
        id,
        applicationId,
        name: cleanName(fileName),
        mime,
        size: (await stat(original)).size,
        width: size?.width ?? null,
        height: size?.height ?? null,
        hasPreview: size ? 1 : 0,
        now: now(),
        max: MAX_PHOTOS,
      },
    );
    if (changes === 0) {
      throw new UploadError(409, `Можно добавить не больше ${MAX_PHOTOS} фото`);
    }
    return findPhoto(id)!;
  } catch (error) {
    await discard();
    throw error;
  }
}

export async function removePhoto(photo: Photo) {
  run("DELETE FROM photos WHERE id = :id", { id: photo.id });
  await Promise.all(
    (["original", "preview", "thumb"] as const).map((variant) =>
      rm(photoFile(photo, variant), { force: true }),
    ),
  );
}

/** Deletes every file of an application. Its database rows go with the application itself. */
export async function removeApplicationFiles(applicationId: number) {
  await rm(folder(applicationId), { recursive: true, force: true });
}

/* ---------- Download ---------- */

/** A response streaming one stored file. */
export async function photoResponse(
  photo: Photo,
  variant: Variant,
  options: { download?: boolean; cache: string },
) {
  const file = photoFile(photo, variant);
  const size = await stat(file).then(
    (stats) => stats.size,
    () => null,
  );
  if (size === null) return new Response(null, { status: 404 });

  const headers = new Headers({
    "Content-Type": variant === "original" ? photo.mime : "image/webp",
    "Content-Length": String(size),
    "Cache-Control": options.cache,
    // The bytes are an applicant's upload: the browser must not second-guess the type.
    "X-Content-Type-Options": "nosniff",
  });
  if (options.download) {
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(photo.name)}`,
    );
  }
  return new Response(
    Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
    { headers },
  );
}
