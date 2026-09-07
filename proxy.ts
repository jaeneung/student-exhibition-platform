import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProjectByIdForManagement, getPublicProjectById } from "@/lib/store";

/**
 * A Next.js async Server Component that awaits data before calling notFound()
 * only produces a soft 404 (200 status + noindex): rendering has already
 * started streaming by the time the check resolves, so the status code can no
 * longer change (see app/projects/[id]/page.tsx and Next's own docs on
 * loading.js Status Codes). Getting a real 404 requires resolving the check
 * before rendering starts — this proxy does that, then rewrites to /gone
 * (a synchronous page that calls notFound() with nothing left to await) so
 * the response carries a genuine 404 while the visible URL stays unchanged.
 *
 * This only re-implements the same visibility rule already enforced in
 * lib/store.ts (getPublicProjectById / getProjectByIdForManagement) — it is
 * a status-code convenience on top of that enforcement, not a second
 * enforcement point to keep in sync by hand.
 */
export const config = {
  matcher: ["/projects/:id", "/manage/:id/edit"],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = decodeURIComponent(projectMatch[1]);
    const project = await getPublicProjectById(id);
    if (!project) {
      return NextResponse.rewrite(new URL("/gone", request.url));
    }
    return NextResponse.next();
  }

  const editMatch = pathname.match(/^\/manage\/([^/]+)\/edit$/);
  if (editMatch) {
    const id = decodeURIComponent(editMatch[1]);
    const project = await getProjectByIdForManagement(id);
    if (!project) {
      return NextResponse.rewrite(new URL("/gone", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
