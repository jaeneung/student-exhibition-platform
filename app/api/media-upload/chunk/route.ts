import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/mediaUploadGuard";
import { saveChunk } from "@/lib/mediaUploadChunks";
import { MAX_GITHUB_RELAY_BYTES, MEDIA_UPLOAD_CHUNK_BYTES } from "@/lib/uploadLimits";

// A generous few chunks above what MAX_GITHUB_RELAY_BYTES actually requires
// at the current chunk size — bounds a malicious `total` claim without
// being so tight that raising MAX_GITHUB_RELAY_BYTES later means
// remembering to update this too.
const MAX_CHUNKS = Math.ceil(MAX_GITHUB_RELAY_BYTES / MEDIA_UPLOAD_CHUNK_BYTES) + 4;

/**
 * Accepts one piece of a video or PDF being relayed to GitHub (see
 * lib/github.ts) — the browser splits the file into chunks small enough to
 * individually clear Netlify's own per-request body-size ceiling (see
 * lib/uploadLimits.ts) and uploads them one at a time; app/api/media-upload/
 * finalize/route.ts reassembles them once every chunk has arrived here.
 *
 * uploadId/index/total travel as query params rather than JSON alongside
 * the bytes, so the request body can be the raw chunk with no multipart or
 * base64 overhead eating into the size budget this route exists to respect.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");
  const index = Number(url.searchParams.get("index"));
  const total = Number(url.searchParams.get("total"));

  if (
    !uploadId ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(uploadId) ||
    !Number.isInteger(index) ||
    index < 0 ||
    !Number.isInteger(total) ||
    total <= 0 ||
    total > MAX_CHUNKS ||
    index >= total
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MEDIA_UPLOAD_CHUNK_BYTES) {
    return NextResponse.json({ error: "invalid_chunk_size" }, { status: 413 });
  }

  await saveChunk(uploadId, index, buffer.toString("base64"));
  return NextResponse.json({ ok: true });
}
