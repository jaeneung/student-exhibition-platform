import { afterEach, describe, expect, it, vi } from "vitest";

describe("isLinkReachable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true for a 2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
    const { isLinkReachable } = await import("@/lib/linkCheck");
    expect(await isLinkReachable("https://example.com")).toBe(true);
  });

  it("returns false for a 404 response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    const { isLinkReachable } = await import("@/lib/linkCheck");
    expect(await isLinkReachable("https://example.com/missing")).toBe(false);
  });

  it("returns false for a 500 response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    const { isLinkReachable } = await import("@/lib/linkCheck");
    expect(await isLinkReachable("https://example.com/broken")).toBe(false);
  });

  it("returns false when the request throws (network error, DNS failure, etc.)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      })
    );
    const { isLinkReachable } = await import("@/lib/linkCheck");
    expect(await isLinkReachable("https://this-domain-does-not-exist.invalid")).toBe(false);
  });

  it("returns false when the request times out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      })
    );
    const { isLinkReachable } = await import("@/lib/linkCheck");
    const resultPromise = isLinkReachable("https://slow.example.com");
    await vi.advanceTimersByTimeAsync(6_000);
    expect(await resultPromise).toBe(false);
    vi.useRealTimers();
  });
});
