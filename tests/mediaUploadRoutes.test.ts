import { afterEach, describe, expect, it, vi } from "vitest";
import { readChunk, saveChunk } from "@/lib/mediaUploadChunks";

const ORIGIN = "https://student-exhibition-platform.netlify.app";

function sameOriginHeaders(extra: Record<string, string> = {}) {
  return {
    host: "student-exhibition-platform.netlify.app",
    origin: ORIGIN,
    ...extra,
  };
}

describe("POST /api/media-upload/chunk", () => {
  it("saves a valid chunk and returns ok", async () => {
    const { POST } = await import("@/app/api/media-upload/chunk/route");
    const uploadId = "test-chunk-ok";
    const request = new Request(
      `${ORIGIN}/api/media-upload/chunk?uploadId=${uploadId}&index=0&total=1`,
      { method: "POST", headers: sameOriginHeaders(), body: new Uint8Array([1, 2, 3]) }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    const saved = await readChunk(uploadId, 0);
    expect(saved).toBe(Buffer.from([1, 2, 3]).toString("base64"));
  });

  it("rejects a cross-origin request", async () => {
    const { POST } = await import("@/app/api/media-upload/chunk/route");
    const request = new Request(
      `${ORIGIN}/api/media-upload/chunk?uploadId=test-cross-origin&index=0&total=1`,
      {
        method: "POST",
        headers: { host: "student-exhibition-platform.netlify.app", origin: "https://evil.example.com" },
        body: new Uint8Array([1]),
      }
    );
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("rejects a malformed uploadId", async () => {
    const { POST } = await import("@/app/api/media-upload/chunk/route");
    const request = new Request(
      `${ORIGIN}/api/media-upload/chunk?uploadId=${encodeURIComponent("../../etc")}&index=0&total=1`,
      { method: "POST", headers: sameOriginHeaders(), body: new Uint8Array([1]) }
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects an out-of-range index", async () => {
    const { POST } = await import("@/app/api/media-upload/chunk/route");
    const request = new Request(
      `${ORIGIN}/api/media-upload/chunk?uploadId=test-oob&index=5&total=3`,
      { method: "POST", headers: sameOriginHeaders(), body: new Uint8Array([1]) }
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects a chunk larger than MEDIA_UPLOAD_CHUNK_BYTES", async () => {
    const { MEDIA_UPLOAD_CHUNK_BYTES } = await import("@/lib/uploadLimits");
    const { POST } = await import("@/app/api/media-upload/chunk/route");
    const request = new Request(
      `${ORIGIN}/api/media-upload/chunk?uploadId=test-too-big&index=0&total=1`,
      {
        method: "POST",
        headers: sameOriginHeaders(),
        body: new Uint8Array(MEDIA_UPLOAD_CHUNK_BYTES + 1),
      }
    );
    const response = await POST(request);
    expect(response.status).toBe(413);
  });
});

describe("POST /api/media-upload/finalize", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/github");
    vi.resetModules();
  });

  it("reassembles chunks, relays to GitHub, and cleans up", async () => {
    vi.doMock("@/lib/github", () => ({
      uploadFileToGithub: vi.fn(async () => "https://github.com/example/releases/download/media/video.mp4"),
    }));
    const uploadId = "test-finalize-ok";
    await saveChunk(uploadId, 0, Buffer.from("hello-").toString("base64"));
    await saveChunk(uploadId, 1, Buffer.from("world").toString("base64"));

    const { POST } = await import("@/app/api/media-upload/finalize/route");
    const { uploadFileToGithub } = await import("@/lib/github");
    const request = new Request(`${ORIGIN}/api/media-upload/finalize`, {
      method: "POST",
      headers: { ...sameOriginHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        uploadId,
        totalChunks: 2,
        filename: "clip.mp4",
        contentType: "video/mp4",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBe("https://github.com/example/releases/download/media/video.mp4");
    expect(vi.mocked(uploadFileToGithub)).toHaveBeenCalledWith(
      Buffer.from("hello-world"),
      "clip.mp4",
      "video/mp4"
    );
    expect(await readChunk(uploadId, 0)).toBeUndefined();
    expect(await readChunk(uploadId, 1)).toBeUndefined();
  });

  it("also relays a PDF, not just video", async () => {
    vi.doMock("@/lib/github", () => ({
      uploadFileToGithub: vi.fn(async () => "https://github.com/example/releases/download/media/report.pdf"),
    }));
    // Dynamically re-imported (rather than using this file's top-level
    // saveChunk/readChunk) so this resolves to the exact same module
    // instance the freshly-imported route below will read from — a prior
    // test's afterEach calls vi.resetModules(), which would otherwise leave
    // the top-level import pointing at a stale, separate in-memory store.
    const { saveChunk: saveChunkFresh } = await import("@/lib/mediaUploadChunks");
    const uploadId = "test-finalize-pdf";
    await saveChunkFresh(uploadId, 0, Buffer.from("%PDF-1.4").toString("base64"));

    const { POST } = await import("@/app/api/media-upload/finalize/route");
    const { uploadFileToGithub } = await import("@/lib/github");
    const request = new Request(`${ORIGIN}/api/media-upload/finalize`, {
      method: "POST",
      headers: { ...sameOriginHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        uploadId,
        totalChunks: 1,
        filename: "report.pdf",
        contentType: "application/pdf",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBe("https://github.com/example/releases/download/media/report.pdf");
    expect(vi.mocked(uploadFileToGithub)).toHaveBeenCalledWith(
      Buffer.from("%PDF-1.4"),
      "report.pdf",
      "application/pdf"
    );
  });

  it("rejects a content type that isn't video or PDF", async () => {
    vi.doMock("@/lib/github", () => ({ uploadFileToGithub: vi.fn() }));
    const { POST } = await import("@/app/api/media-upload/finalize/route");
    const request = new Request(`${ORIGIN}/api/media-upload/finalize`, {
      method: "POST",
      headers: { ...sameOriginHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        uploadId: "test-not-relayable",
        totalChunks: 1,
        filename: "notes.txt",
        contentType: "text/plain",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("reports a missing chunk instead of relaying a partial file", async () => {
    vi.doMock("@/lib/github", () => ({ uploadFileToGithub: vi.fn() }));
    const uploadId = "test-missing-chunk";
    await saveChunk(uploadId, 0, Buffer.from("only-this-one").toString("base64"));

    const { POST } = await import("@/app/api/media-upload/finalize/route");
    const { uploadFileToGithub } = await import("@/lib/github");
    const request = new Request(`${ORIGIN}/api/media-upload/finalize`, {
      method: "POST",
      headers: { ...sameOriginHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        uploadId,
        totalChunks: 2,
        filename: "clip.mp4",
        contentType: "video/mp4",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(vi.mocked(uploadFileToGithub)).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request", async () => {
    vi.doMock("@/lib/github", () => ({ uploadFileToGithub: vi.fn() }));
    const { POST } = await import("@/app/api/media-upload/finalize/route");
    const request = new Request(`${ORIGIN}/api/media-upload/finalize`, {
      method: "POST",
      headers: {
        host: "student-exhibition-platform.netlify.app",
        origin: "https://evil.example.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ uploadId: "x", totalChunks: 1, filename: "a.mp4", contentType: "video/mp4" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
