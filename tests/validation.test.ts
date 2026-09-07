import { describe, expect, it } from "vitest";
import { isValidLaunchUrl, isValidOptionalImageUrl } from "@/lib/validation";

describe("isValidLaunchUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidLaunchUrl("https://example.com/game")).toBe(true);
    expect(isValidLaunchUrl("http://example.com")).toBe(true);
  });

  it("rejects unsafe or unsupported URL schemes", () => {
    expect(isValidLaunchUrl("javascript:alert(1)")).toBe(false);
    expect(isValidLaunchUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isValidLaunchUrl("ftp://example.com")).toBe(false);
    expect(isValidLaunchUrl("mailto:test@example.com")).toBe(false);
    expect(isValidLaunchUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects malformed or empty input", () => {
    expect(isValidLaunchUrl("")).toBe(false);
    expect(isValidLaunchUrl("not a url")).toBe(false);
    expect(isValidLaunchUrl("example.com")).toBe(false);
  });

  it("rejects values with leading/trailing whitespace", () => {
    expect(isValidLaunchUrl(" https://example.com")).toBe(false);
    expect(isValidLaunchUrl("https://example.com ")).toBe(false);
  });
});

describe("isValidOptionalImageUrl", () => {
  it("treats an absent value as valid (optional field)", () => {
    expect(isValidOptionalImageUrl(undefined)).toBe(true);
    expect(isValidOptionalImageUrl("")).toBe(true);
  });

  it("validates a provided value the same way as a launch URL", () => {
    expect(isValidOptionalImageUrl("https://example.com/cover.png")).toBe(true);
    expect(isValidOptionalImageUrl("javascript:alert(1)")).toBe(false);
  });
});
