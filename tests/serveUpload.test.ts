import { describe, expect, it } from "vitest";
import { serveUpload } from "@/lib/serveUpload";

describe("serveUpload", () => {
  it("serves the entry file's content when no path is requested", async () => {
    const res = serveUpload(
      {
        uploadedFiles: { "index.html": { contentBase64: Buffer.from("<p>hi</p>").toString("base64"), contentType: "text/html" } },
        entryPath: "index.html",
      },
      undefined
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(await res.text()).toBe("<p>hi</p>");
  });

  it("serves a nested asset by its exact path", async () => {
    const res = serveUpload(
      {
        uploadedFiles: {
          "index.html": { contentBase64: Buffer.from("<img>").toString("base64"), contentType: "text/html" },
          "images/logo.png": { contentBase64: Buffer.from("fake-png").toString("base64"), contentType: "image/png" },
        },
        entryPath: "index.html",
      },
      "images/logo.png"
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(await res.text()).toBe("fake-png");
  });

  it("404s for a path not present in uploadedFiles", async () => {
    const res = serveUpload(
      { uploadedFiles: { "index.html": { contentBase64: "", contentType: "text/html" } }, entryPath: "index.html" },
      "missing.js"
    );
    expect(res.status).toBe(404);
  });

  it("serves legacy uploadedHtml when no path is requested", async () => {
    const res = serveUpload({ uploadedHtml: "<p>legacy</p>" }, undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(await res.text()).toBe("<p>legacy</p>");
  });

  it("404s for a path requested against a legacy uploadedHtml-only upload", async () => {
    const res = serveUpload({ uploadedHtml: "<p>legacy</p>" }, "anything");
    expect(res.status).toBe(404);
  });

  it("404s when there's nothing uploaded at all", async () => {
    const res = serveUpload({}, undefined);
    expect(res.status).toBe(404);
  });
});
