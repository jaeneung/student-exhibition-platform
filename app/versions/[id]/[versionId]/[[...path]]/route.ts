import { NextResponse } from "next/server";
import { hasValidTeacherSession } from "@/lib/auth";
import { serveUpload } from "@/lib/serveUpload";
import { getStudentSession } from "@/lib/studentAuth";
import { getProjectByIdForManagement, getProjectVersionContent } from "@/lib/store";

/**
 * Serves one past version of a project's launch content (see
 * lib/types.ts's ProjectVersion and app/my/actions.ts, which snapshots the
 * old launch fields here whenever a student replaces them). Reuses
 * app/files/[id]/[[...path]]/route.ts's serving logic (lib/serveUpload.ts)
 * so old and current content are rendered identically.
 *
 * Unlike /files/{id} (open to anyone who knows the id, the same trust level
 * as an unlisted external link), this is gated to the project's owning
 * student or a logged-in teacher: a stored version may predate the review
 * that approved the *current* one, or be exactly what a teacher asked to
 * have replaced, so it shouldn't be reachable by simply guessing/sharing a
 * URL the way a live, already-reviewed project's is.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string; path?: string[] }> }
) {
  const { id, versionId, path } = await params;

  const [isTeacher, studentId, project] = await Promise.all([
    hasValidTeacherSession(),
    getStudentSession(),
    getProjectByIdForManagement(id),
  ]);

  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!isTeacher && (!studentId || studentId !== project.ownerId)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const version = project.versions?.find((v) => v.id === versionId);
  if (!version) {
    return new NextResponse("Not found", { status: 404 });
  }

  // The version's own uploadedFiles/uploadedHtml live in their own storage
  // key, not inline on `version` itself (see lib/store.ts's content-storage
  // section) — kept separate for the same reason a project's *current*
  // content is, so listing a project's version history never has to
  // transfer every past upload just to show a timestamp.
  const content = await getProjectVersionContent(id, versionId);
  const requestedPath = path && path.length > 0 ? path.map(decodeURIComponent).join("/") : undefined;
  return serveUpload({ ...version, ...content }, requestedPath);
}
