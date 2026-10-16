import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { findPhoto, photoResponse, type Variant } from "@/lib/photos";

/**
 * An applicant's photo, for signed-in staff only.
 *
 *   /files/<id>                    the large preview
 *   /files/<id>?variant=thumb      the small square one
 *   /files/<id>?variant=original   the file exactly as uploaded, as a download
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/files/[photoId]">,
) {
  await requireUser();
  const { photoId } = await context.params;
  const photo = findPhoto(photoId);
  if (!photo) return new Response(null, { status: 404 });

  const requested = request.nextUrl.searchParams.get("variant");
  const variant: Variant =
    requested === "original" || !photo.hasPreview
      ? "original"
      : requested === "thumb"
        ? "thumb"
        : "preview";

  return photoResponse(photo, variant, {
    // The original is never rendered in the panel's own pages: it may be any
    // file type the applicant got past the check, so it only ever downloads.
    download: variant === "original",
    // A photo never changes once stored; "private" keeps it out of shared caches.
    cache: "private, max-age=31536000, immutable",
  });
}
