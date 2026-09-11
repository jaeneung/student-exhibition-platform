const THUMBNAIL_SERVICE_BASE = "https://image.thum.io/get/width/800/crop/600/noanimate";

/**
 * Builds a URL to a free, keyless screenshot service (thum.io) for `targetUrl`,
 * used as the auto-generated cover image when a student doesn't provide one.
 * thum.io returns a generic placeholder image on a URL's first request while
 * it renders the real screenshot in the background, then serves the real one
 * on later requests — so a brand-new project's thumbnail can look generic for
 * a short while after submission.
 *
 * Requires `targetUrl` to be publicly reachable: an uploaded-file project's
 * own /files/{id} address works once deployed, but thum.io can't reach a
 * local http://localhost dev server, so thumbnails for locally-tested file
 * uploads won't render (the cover image falls back to the category icon).
 */
export function buildAutoThumbnailUrl(targetUrl: string): string {
  return `${THUMBNAIL_SERVICE_BASE}/${targetUrl}`;
}
