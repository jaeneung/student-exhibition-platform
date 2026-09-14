import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/dictionary";
import { resolveLaunchFields } from "@/lib/formAction";

const dict = getDictionary("ko");
const id = "11111111-1111-1111-1111-111111111111";
const origin = "https://kis-exhibition.example";

function htmlFile(content: string, name = "project.html", type = "text/html") {
  return new File([content], name, { type });
}

async function zipFile(entries: Record<string, string>, name = "project.zip"): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buffer], name, { type: "application/zip" });
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

  it("rejects a file type that isn't HTML, ZIP, image, or PDF", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: htmlFile("not html", "notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("rejects a file over the size limit", async () => {
    const bigContent = "a".repeat(4 * 1024 * 1024 + 1);
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

describe("resolveLaunchFields — file mode, .zip upload", () => {
  it("extracts every file and launches at the entry page's own nested path", async () => {
    const file = await zipFile({
      "index.html": "<img src='images/4.png'>",
      "images/4.png": "fake-image-bytes",
    });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}/index.html`);
      expect(result.value.entryPath).toBe("index.html");
      expect(result.value.uploadedFiles?.["index.html"].contentType).toContain("text/html");
      expect(result.value.uploadedFiles?.["images/4.png"].contentType).toBe("image/png");
      expect(
        Buffer.from(result.value.uploadedFiles?.["images/4.png"].contentBase64 ?? "", "base64").toString()
      ).toBe("fake-image-bytes");
      // The auto-thumbnail must point at the exact same launch URL.
      expect(result.value.coverImageUrl).toContain(result.value.launchUrl);
    }
  });

  it("prefers a top-level index.html over a nested .html file", async () => {
    const file = await zipFile({
      "index.html": "<p>root</p>",
      "pages/about.html": "<p>about</p>",
    });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entryPath).toBe("index.html");
    }
  });

  it("picks the shallowest .html file when there's no index.html", async () => {
    const file = await zipFile({
      "pages/deep/nested.html": "<p>deep</p>",
      "main.html": "<p>main</p>",
    });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entryPath).toBe("main.html");
    }
  });

  it("rejects a zip with no HTML file inside", async () => {
    const file = await zipFile({ "readme.txt": "no html here" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("rejects a corrupted/non-zip file with a .zip name", async () => {
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: new File(["not actually a zip"], "project.zip", { type: "application/zip" }),
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });

  it("keeps the existing zip upload when editing without choosing a new file", async () => {
    const existingFiles = {
      "index.html": { contentBase64: Buffer.from("<p>old</p>").toString("base64"), contentType: "text/html" },
    };
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file: null,
      coverImageUrl: "",
      id,
      origin,
      dict,
      existing: {
        launchUrl: `${origin}/files/${id}/index.html`,
        uploadedFiles: existingFiles,
        entryPath: "index.html",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.uploadedFiles).toBe(existingFiles);
      expect(result.value.entryPath).toBe("index.html");
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}/index.html`);
    }
  });
});

describe("resolveLaunchFields — file mode, single image/PDF upload", () => {
  it("accepts a PNG image and launches at the bare /files/{id} address", async () => {
    const file = new File(["fake-png-bytes"], "poster.png", { type: "image/png" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}`);
      expect(result.value.entryPath).toBe("poster.png");
      expect(result.value.uploadedFiles?.["poster.png"].contentType).toBe("image/png");
      // The image itself is the cover — no thum.io screenshot of a picture.
      expect(result.value.coverImageUrl).toBe(`${origin}/files/${id}`);
    }
  });

  it("recognizes an image by extension even with a generic MIME type", async () => {
    const file = new File(["fake-jpeg-bytes"], "photo.jpg", { type: "application/octet-stream" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.uploadedFiles?.["photo.jpg"].contentType).toBe("image/jpeg");
    }
  });

  it("accepts a PDF and does not override an explicit cover image", async () => {
    const file = new File(["%PDF-fake"], "report.pdf", { type: "application/pdf" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "https://example.com/custom-cover.png",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.launchUrl).toBe(`${origin}/files/${id}`);
      expect(result.value.entryPath).toBe("report.pdf");
      expect(result.value.uploadedFiles?.["report.pdf"].contentType).toBe("application/pdf");
      expect(result.value.coverImageUrl).toBe("https://example.com/custom-cover.png");
    }
  });

  it("falls back to a thum.io screenshot for a PDF with no explicit cover image", async () => {
    const file = new File(["%PDF-fake"], "report.pdf", { type: "application/pdf" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.coverImageUrl).toContain(result.value.launchUrl);
      expect(result.value.coverImageUrl).not.toBe(result.value.launchUrl);
    }
  });

  it("rejects an SVG upload (script-capable, same as HTML)", async () => {
    const file = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
    const result = await resolveLaunchFields({
      mode: "file",
      url: "",
      file,
      coverImageUrl: "",
      id,
      origin,
      dict,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.launchFile).toBeDefined();
  });
});
