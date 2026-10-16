import type { NextRequest } from "next/server";
import { accountHolder } from "@/lib/accounts";
import { findOwnApplication, recordPhotoChange } from "@/lib/applications";
import { findPhoto, photoResponse, removePhoto } from "@/lib/photos";
import { CLOSED, NOT_FOUND, problem } from "@/lib/public-api";
import { isAccepting } from "@/lib/settings";

type Context = RouteContext<"/api/public/applications/[id]/photos/[photoId]">;

/** The photo, if it sits on an application of the applicant making the request. */
async function ownPhoto(context: Context) {
  const { id, photoId } = await context.params;
  const who = await accountHolder();
  const application = who && findOwnApplication(who, id);
  if (!application) return null;

  const photo = findPhoto(photoId);
  if (photo?.applicationId !== application.id) return null;
  return { application, photo };
}

// Stands in for a photo that could not be decoded (HEIC, mostly).
const PLACEHOLDER =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#e5e3ec"/></svg>';

/** A small preview, for the edit form on the site. */
export async function GET(_request: NextRequest, context: Context) {
  const own = await ownPhoto(context);
  if (!own) return problem(404, NOT_FOUND);

  const cache = "private, max-age=86400, immutable";
  if (!own.photo.hasPreview) {
    return new Response(PLACEHOLDER, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": cache },
    });
  }
  return photoResponse(own.photo, "thumb", { cache });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const own = await ownPhoto(context);
  if (!own) return problem(404, NOT_FOUND);
  if (!isAccepting()) return problem(403, CLOSED);

  await removePhoto(own.photo);
  recordPhotoChange(own.application);
  return new Response(null, { status: 204 });
}
