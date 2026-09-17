import { NextResponse } from "next/server";
import { serveUpload } from "@/lib/serveUpload";
import { getProjectByIdForManagement } from "@/lib/store";

/**
 * Serves a student's uploaded site as its own launch page — this is what an
 * uploaded-file project's launchUrl actually points to, whether that's a
 * lone .html file (served at exactly /files/{id}) or a .zip's worth of
 * files (served at /files/{id}/{path}, one path per file inside the zip —
 * see lib/uploadedSite.ts for why preserving those paths exactly is what
 * makes a page's own relative image/CSS/JS references resolve correctly).
 *
 * Not gated by exhibition status, for the same reason an external launch URL
 * isn't either: reaching this route requires knowing the project's id (a
 * random UUID, never exposed through the public gallery for a hidden
 * project), the same trust boundary as an unlisted external link.
 *
 * Uploaded content is served as-is with no sanitization beyond the
 * extension/MIME check made at upload time (see lib/formAction.ts) — its
 * safety depends on the same teacher-review gate that already exists before
 * a project goes on display, not on anything this route does.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> }
) {
  const { id, path } = await params;
  const project = await getProjectByIdForManagement(id);

  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }

  const requestedPath = path && path.length > 0 ? path.map(decodeURIComponent).join("/") : undefined;
  return serveUpload(project, requestedPath);
}
