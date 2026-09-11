import { NextResponse } from "next/server";
import { getProjectByIdForManagement } from "@/lib/store";

/**
 * Serves a student's uploaded HTML file as the project's own launch page —
 * this is what an uploaded-file project's launchUrl actually points to.
 *
 * Not gated by exhibition status, for the same reason an external launch URL
 * isn't either: reaching this route requires knowing the project's id (a
 * random UUID, never exposed through the public gallery for a hidden
 * project), the same trust boundary as an unlisted external link.
 *
 * The uploaded HTML is served as-is with no sanitization beyond the
 * extension/MIME check made at upload time (see lib/formAction.ts) — its
 * safety depends on the same teacher-review gate that already exists before
 * a project goes on display, not on anything this route does.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProjectByIdForManagement(id);

  if (!project?.uploadedHtml) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(project.uploadedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
