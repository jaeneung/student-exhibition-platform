import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/dictionary";
import { resolveLaunchFields } from "@/lib/formAction";

const dict = getDictionary("ko");
const id = "11111111-1111-1111-1111-111111111111";
const origin = "https://kis-exhibition.example";

function htmlFile(content: string, name = "project.html", type = "text/html") {
  return new File([content], name, { type });
}

describe("resolveLaunchFields — URL mode", () => {
  it("accepts a valid http(s) URL and auto-generates a cover thumbnail", async () => {
    const result = await resolveLaunchFields({
      mode: "url",
      url: "https://example.com/my-project",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.launchUrl).toBe("https://example.com/my-project");
      expect(result.value.uploadedHtml).toBeUndefined();
      expect(result.value.coverImageUrl).toContain("https://example.com/my-project");
      expect(result.value.coverImageUrl).toMatch(/^https:\/\/image\.thum\.io\//);
    }
  });

  it("keeps an explicitly provided cover image instead of auto-generating one", async () => {
    const result = await resolveLaunchFields({
      mode: "url",
      url: "https://example.com/my-project",
      file: null,
      coverImageUrl: "https://example.com/my-cover.png",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.coverImageUrl).toBe("https://example.com/my-cover.png");
    }
  });

  it("rejects an unsafe URL scheme", async () => {
    const result = await resolveLaunchFields({
      mode: "url",
      url: "javascript:alert(1)",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchUrl).toBeDefined();
  });

  it("rejects a missing URL", async () => {
    const result = await resolveLaunchFields({
      mode: "url",
      url: "",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchUrl).toBeDefined();
  });

  it("rejects an invalid cover image URL", async () => {
    const result = await resolveLaunchFields({
      mode: "url",
      url: "https://example.com/my-project",
      file: null,
      coverImageUrl: "not-a-url",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.coverImageUrl).toBeDefined();
  });
});

describe("resolveLaunchFields — file mode", () => {
  it("hosts the uploaded HTML at the project's own /files/{id} address", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile("<html><body>Hi</body></html>"),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}`);
      expect(result.value.uploadedHtml).toBe("<html><body>Hi</body></html>");
      // The auto-thumbnail must point at the exact same launch URL, the same
      // guarantee the QR code/launch link share for URL-mode projects.
      expect(result.value.coverImageUrl).toContain(result.value.launchUrl);
    }
  });

  it("accepts a file recognized by its .html extension even without an HTML MIME type", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile("<html></html>", "index.html", "application/octet-stream"),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a missing file when there's nothing existing to fall back to", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("rejects a non-HTML file", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile("not html", "photo.png", "image/png"),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("rejects a file over the size limit", async () => {
    const bigContent = "a".repeat(3 * 1024 * 1024 + 1);
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile(bigContent),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("keeps the existing upload when editing without choosing a new file", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
      existing: { launchUrl: `${origin}/files/${id}`, uploadedHtml: "<p>old</p>" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.uploadedHtml).toBe("<p>old</p>");
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}`);
    }
  });

  it("replaces the existing upload when a new file is chosen during edit", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile("<p>new</p>"),
      coverImageUrl: "",
      id,
      origin,
      dict,
      existing: { launchUrl: `${origin}/files/${id}`, uploadedHtml: "<p>old</p>" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.uploadedHtml).toBe("<p>new</p>");
    }
  });
});
