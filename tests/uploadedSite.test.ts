import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildSiteFromEntries, contentTypeForPath, extractZipSite } from "@/lib/uploadedSite";

async function buildZip(entries: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("contentTypeForPath", () => {
  it("maps known extensions to their MIME type", () => {
    expect(contentTypeForPath("index.html")).toContain("text/html");
    expect(contentTypeForPath("images/4.png")).toBe("image/png");
    expect(contentTypeForPath("style.css")).toContain("text/css");
  });

  it("falls back to a generic binary type for unknown extensions", () => {
    expect(contentTypeForPath("data.unknownext")).toBe("application/octet-stream");
  });

  it("maps common document formats (Word/Excel/PowerPoint/HWP/CSV)", () => {
    expect(contentTypeForPath("report.docx")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(contentTypeForPath("sheet.xlsx")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(contentTypeForPath("slides.pptx")).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    expect(contentTypeForPath("문서.hwp")).toBe("application/x-hwp");
    expect(contentTypeForPath("data.csv")).toContain("text/csv");
  });
});

describe("extractZipSite", () => {
  it("extracts every file and normalizes forward-slash paths", async () => {
    const buffer = await buildZip({
      "index.html": "<img src='images/4.png'>",
      "images/4.png": "fake-bytes",
    });
    const result = await extractZipSite(buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entryPath).toBe("index.html");
      expect(Object.keys(result.value.files).sort()).toEqual(["images/4.png", "index.html"]);
    }
  });

  it("normalizes backslash-separated entry names (Windows' Compress-Archive uses these)", async () => {
    const zip = new JSZip();
    zip.file("index.html", "<img src='images/4.png'>");
    zip.file("images\\4.png", "fake-bytes");
    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    const result = await extractZipSite(buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.files["images/4.png"]).toBeDefined();
      expect(result.value.files["images\\4.png"]).toBeUndefined();
    }
  });

  it("drops __MACOSX metadata and ._ resource-fork files", async () => {
    const buffer = await buildZip({
      "index.html": "<p>hi</p>",
      "__MACOSX/._index.html": "resource fork junk",
      "images/._4.png": "resource fork junk",
      "images/4.png": "real-bytes",
    });
    const result = await extractZipSite(buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value.files).sort()).toEqual(["images/4.png", "index.html"]);
    }
  });

  it("reports empty when the zip has no real files", async () => {
    const buffer = await buildZip({});
    const result = await extractZipSite(buffer);
    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("reports no-html when the zip has files but none are HTML", async () => {
    const buffer = await buildZip({ "readme.txt": "no html here" });
    const result = await extractZipSite(buffer);
    expect(result).toEqual({ ok: false, reason: "no-html" });
  });

  it("reports invalid for a corrupted/non-zip buffer", async () => {
    const buffer = new TextEncoder().encode("not a zip file").buffer;
    const result = await extractZipSite(buffer);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("buildSiteFromEntries", () => {
  it("builds a site from a flat list of path/content entries (a browser folder picker's shape)", () => {
    const result = buildSiteFromEntries([
      { path: "index.html", contentBase64: Buffer.from("<img src='images/4.png'>").toString("base64") },
      { path: "images/4.png", contentBase64: Buffer.from("fake-bytes").toString("base64") },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entryPath).toBe("index.html");
      expect(result.value.files["images/4.png"].contentType).toBe("image/png");
    }
  });

  it("drops OS file-browser junk (Thumbs.db, desktop.ini, .DS_Store)", () => {
    const result = buildSiteFromEntries([
      { path: "index.html", contentBase64: Buffer.from("<p>hi</p>").toString("base64") },
      { path: "Thumbs.db", contentBase64: "" },
      { path: "images/desktop.ini", contentBase64: "" },
      { path: ".DS_Store", contentBase64: "" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value.files)).toEqual(["index.html"]);
    }
  });

  it("reports empty for no entries", () => {
    expect(buildSiteFromEntries([])).toEqual({ ok: false, reason: "empty" });
  });

  it("reports no-html when nothing is an HTML file", () => {
    const result = buildSiteFromEntries([{ path: "readme.txt", contentBase64: "" }]);
    expect(result).toEqual({ ok: false, reason: "no-html" });
  });
});
