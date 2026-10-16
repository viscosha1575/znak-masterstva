import type { NextRequest } from "next/server";
import { accountHolder } from "@/lib/accounts";
import { findOwnApplication, recordPhotoChange } from "@/lib/applications";
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from "@/lib/dictionaries";
import { listPhotos, storePhoto, UploadError } from "@/lib/photos";
import { CLOSED, NOT_FOUND, problem, TOO_MANY } from "@/lib/public-api";
import { allow, HOUR } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isAccepting } from "@/lib/settings";

/**
 * Adds one photo to the applicant's own application. The request body is the
 * file itself; its name travels URL-encoded in X-File-Name. One file per
 * request keeps every upload within the 30 MB limit, and lets the site retry
 * a single failed photo.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/public/applications/[id]/photos">,
) {
  const { id } = await context.params;
  const who = await accountHolder();
  const application = who && findOwnApplication(who, id);
  if (!application) return problem(404, NOT_FOUND);
  if (!isAccepting()) return problem(403, CLOSED);
  if (!allow(`photo:${clientIp(request.headers)}`, 100, HOUR)) {
    return problem(429, TOO_MANY);
  }

  // Cheap refusals first, before a single byte of the file is read.
  if (Number(request.headers.get("content-length")) > MAX_PHOTO_BYTES) {
    return problem(413, "Каждое фото должно быть не больше 30 Мб");
  }
  if (listPhotos(application.id).length >= MAX_PHOTOS) {
    return problem(409, `Можно добавить не больше ${MAX_PHOTOS} фото`);
  }
  if (!request.body) return problem(400, "Файл не получен");

  let name = "";
  try {
    name = decodeURIComponent(request.headers.get("x-file-name") ?? "");
  } catch {
    // A mangled name is not worth refusing the photo over.
  }

  try {
    const photo = await storePhoto(application.id, request.body, name);
    recordPhotoChange(application);
    return Response.json({ id: photo.id, name: photo.name }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return problem(error.status, error.message);
    }
    throw error;
  }
}
