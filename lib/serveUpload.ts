import "server-only";
import { NextResponse } from "next/server";
import type { UploadedFile } from "./types";

/** The shape both a live project (app/files/**) and a stored version
 * snapshot (app/versions/**) share — just the launch-content fields, not
 * the rest of Project/ProjectVersion, so this has no dependency on which
 * one actually called it. */
export interface ServableUpload {
  uploadedFiles?: Record<string, UploadedFile>;
  uploadedHtml?: string;
  entryPath?: string;
}

/**
 * Resolves the actual bytes+content-type to serve for `requestedPath`
 * within `upload` (or its entry page, when no path is given) — shared by
 * app/files/[id]/[[...path]]/route.ts (a project's current, live content)
 * and app/versions/[id]/[versionId]/[[...path]]/route.ts (a past snapshot),
 * so the "how do I turn an uploadedFiles/uploadedHtml blob back into an
 * HTTP response" logic exists exactly once.
 */
export function serveUpload(upload: ServableUpload, requestedPath: string | undefined): NextResponse {
  if (upload.uploadedFiles) {
    const file = upload.uploadedFiles[requestedPath ?? upload.entryPath ?? ""];
    if (!file) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(Buffer.from(file.contentBase64, "base64"), {
      headers: {
        "Content-Type": file.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (!requestedPath && upload.uploadedHtml !== undefined) {
    return new NextResponse(upload.uploadedHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}
