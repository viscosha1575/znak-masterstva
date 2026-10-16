import "server-only";

import type { Application, SaveProblem } from "@/lib/applications";
import { listPhotos } from "@/lib/photos";

/*
 * Helpers for the routes under /api/public — the API the site talks to.
 * Unlike the rest of the panel these are open to everyone; an applicant is
 * recognised by their cookie (lib/participant.ts).
 */

/** An error the site shows to the applicant as it is. */
export function problem(status: number, error: string) {
  return Response.json({ error }, { status });
}

export const CLOSED = "Приём заявок завершён";
export const TOO_MANY = "Слишком много запросов. Попробуйте чуть позже";
export const NOT_FOUND = "Заявка не найдена";

export const SAVE_PROBLEMS: Record<SaveProblem, [number, string]> = {
  limit: [409, "Можно подать не больше двух заявок"],
  nomination: [409, "В этой номинации заявка уже подана"],
  missing: [404, NOT_FOUND],
};

/** The application as the site sees it: no internal number, no moderator, no reason. */
export function toPublic(application: Application) {
  return {
    id: application.publicId,
    name: application.name,
    email: application.email,
    phone: application.phone,
    avitoId: application.avitoUrl,
    city: application.city,
    kind: application.kind,
    field: application.field,
    nomination: application.nomination,
    story: application.story,
    photos: listPhotos(application.id).map(({ id, name }) => ({ id, name })),
    consentPromo: application.consentPromo,
    status: application.status,
    createdAt: application.createdAt,
  };
}

/** Parses a JSON body without trusting its size. `undefined` if it is too big or not JSON. */
export async function readJson(request: Request, maxBytes = 100_000) {
  if (!request.body) return undefined;

  const chunks: Uint8Array[] = [];
  let received = 0;
  for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
    received += chunk.length;
    if (received > maxBytes) return undefined;
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    return undefined;
  }
}
