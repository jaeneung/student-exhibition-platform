import "server-only";
import { getStore } from "@netlify/blobs";
import { isNetlifyRuntime } from "./runtime";

/**
 * Temporary holding area for a video's chunks while it's being relayed to
 * GitHub (see lib/github.ts) — each chunk clears the platform's per-request
 * body-size ceiling on its own, but the complete file doesn't, so it has to
 * be assembled server-side from pieces uploaded across several requests
 * (see the routes under app/api/media-upload/). Same dual-backend pattern as
 * lib/store.ts and lib/loginThrottle.ts: Netlify Blobs in production
 * (Functions share no memory across invocations), a plain in-memory Map in
 * local dev.
 *
 * Chunks for a given uploadId are deleted once finalize() succeeds or fails
 * (see app/api/media-upload/finalize/route.ts) — an uploadId whose browser
 * tab is closed mid-upload leaves its chunks behind with nothing to clean
 * them up automatically. Acceptable for a low-volume school tool; a
 * scheduled cleanup function would be the real fix at larger scale.
 */
const BLOB_STORE_NAME = "exhibition-media-uploads";

const memoryStore = new Map<string, string>();

function chunkKey(uploadId: string, index: number): string {
  return `chunk:${uploadId}:${index}`;
}

export async function saveChunk(uploadId: string, index: number, base64: string): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await store.set(chunkKey(uploadId, index), base64);
    return;
  }
  memoryStore.set(chunkKey(uploadId, index), base64);
}

export async function readChunk(uploadId: string, index: number): Promise<string | undefined> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    const value = await store.get(chunkKey(uploadId, index), { type: "text" });
    return value ?? undefined;
  }
  return memoryStore.get(chunkKey(uploadId, index));
}

export async function deleteChunks(uploadId: string, totalChunks: number): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await Promise.all(
      Array.from({ length: totalChunks }, (_, i) => store.delete(chunkKey(uploadId, i)))
    );
    return;
  }
  for (let i = 0; i < totalChunks; i += 1) {
    memoryStore.delete(chunkKey(uploadId, i));
  }
}
