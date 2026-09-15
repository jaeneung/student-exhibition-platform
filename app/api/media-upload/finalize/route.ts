import { NextResponse } from "next/server";
import { uploadVideoToGithub } from "@/lib/github";
import { deleteChunks, readChunk } from "@/lib/mediaUploadChunks";
import { isSameOriginRequest } from "@/lib/mediaUploadGuard";
import { MAX_GITHUB_VIDEO_BYTES, MEDIA_UPLOAD_CHUNK_BYTES } from "@/lib/uploadLimits";

const MAX_CHUNKS = Math.ceil(MAX_GITHUB_VIDEO_BYTES / MEDIA_UPLOAD_CHUNK_BYTES) + 4;

// Only ever reached after client-side video detection (see
// ProjectForm.tsx) — a hard server-side floor regardless, since a request
// straight to this route wouldn't go through that check at all.
function looksLikeVideoType(contentType: string, filename: string): boolean {
  if (contentType.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|ogv)$/i.test(filename);
}

/**
 * Reassembles every chunk app/api/media-upload/chunk/route.ts received for
 * `uploadId`, relays the complete video to a GitHub Release asset (see
 * lib/github.ts — this is why the target repo has to be public), and
 * returns its public URL for the submission form to use as a normal launch
 * link. Chunks are deleted afterward either way, successful or not, so a
 * failed relay doesn't leave orphaned data behind.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId : undefined;
  const totalChunks = Number(body?.totalChunks);
  const filename = typeof body?.filename === "string" ? body.filename : undefined;
  const contentType = typeof body?.contentType === "string" ? body.contentType : undefined;

  if (
    !uploadId ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(uploadId) ||
    !Number.isInteger(totalChunks) ||
    totalChunks <= 0 ||
    totalChunks > MAX_CHUNKS ||
    !filename ||
    !contentType
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!looksLikeVideoType(contentType, filename)) {
    return NextResponse.json({ error: "not_a_video" }, { status: 400 });
  }

  try {
    const parts: Buffer[] = [];
    for (let i = 0; i < totalChunks; i += 1) {
      const base64 = await readChunk(uploadId, i);
      if (!base64) {
        return NextResponse.json({ error: "missing_chunk", index: i }, { status: 400 });
      }
      parts.push(Buffer.from(base64, "base64"));
    }

    const complete = Buffer.concat(parts);
    if (complete.length > MAX_GITHUB_VIDEO_BYTES) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }

    const url = await uploadVideoToGithub(complete, filename, contentType);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Video relay to GitHub failed:", error);
    return NextResponse.json({ error: "relay_failed" }, { status: 502 });
  } finally {
    await deleteChunks(uploadId, totalChunks);
  }
}
