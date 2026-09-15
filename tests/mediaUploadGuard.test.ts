import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/mediaUploadGuard";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://student-exhibition-platform.netlify.app/api/media-upload/chunk", {
    method: "POST",
    headers,
  });
}

describe("isSameOriginRequest", () => {
  it("accepts a matching Origin header", () => {
    const request = makeRequest({
      host: "student-exhibition-platform.netlify.app",
      origin: "https://student-exhibition-platform.netlify.app",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a mismatched Origin header", () => {
    const request = makeRequest({
      host: "student-exhibition-platform.netlify.app",
      origin: "https://evil.example.com",
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("falls back to a matching Referer when Origin is absent", () => {
    const request = makeRequest({
      host: "student-exhibition-platform.netlify.app",
      referer: "https://student-exhibition-platform.netlify.app/submit",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a mismatched Referer when Origin is absent", () => {
    const request = makeRequest({
      host: "student-exhibition-platform.netlify.app",
      referer: "https://evil.example.com/",
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("rejects when neither Origin nor Referer nor Host is present", () => {
    const request = makeRequest({});
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("treats localhost as http (matches local dev)", () => {
    const request = new Request("http://localhost:3000/api/media-upload/chunk", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });
});
