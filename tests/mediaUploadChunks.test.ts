import { describe, expect, it } from "vitest";
import { deleteChunks, readChunk, saveChunk } from "@/lib/mediaUploadChunks";

describe("mediaUploadChunks (in-memory backend)", () => {
  it("round-trips a saved chunk", async () => {
    await saveChunk("upload-1", 0, "aGVsbG8=");
    expect(await readChunk("upload-1", 0)).toBe("aGVsbG8=");
  });

  it("returns undefined for a chunk that was never saved", async () => {
    expect(await readChunk("upload-never", 0)).toBeUndefined();
  });

  it("keeps chunks from different uploads independent", async () => {
    await saveChunk("upload-a", 0, "AAAA");
    await saveChunk("upload-b", 0, "BBBB");
    expect(await readChunk("upload-a", 0)).toBe("AAAA");
    expect(await readChunk("upload-b", 0)).toBe("BBBB");
  });

  it("deleteChunks removes every chunk for that upload", async () => {
    await saveChunk("upload-delete", 0, "chunk0");
    await saveChunk("upload-delete", 1, "chunk1");
    await deleteChunks("upload-delete", 2);
    expect(await readChunk("upload-delete", 0)).toBeUndefined();
    expect(await readChunk("upload-delete", 1)).toBeUndefined();
  });
});
