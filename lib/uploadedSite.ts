import "server-only";
import JSZip from "jszip";
import type { UploadedFile } from "./types";

const MIME_BY_EXTENSION: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
  pdf: "application/pdf",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
};

export function contentTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

export interface ExtractedSite {
  files: Record<string, UploadedFile>;
  entryPath: string;
}

export type ExtractZipResult =
  | { ok: true; value: ExtractedSite }
  | { ok: false; reason: "invalid" | "empty" | "no-html" };

/**
 * Extracts a `.zip` upload into a flat map of path -> file content, and picks
 * an entry HTML page to launch. Every folder inside the zip is preserved
 * exactly as-is: a student's page referencing "images/4.png" or
 * "../images/4.png" only resolves correctly once served back out at that
 * same relative path, which is the whole point of accepting a zip instead of
 * a lone .html file (a single uploaded file has nowhere for those relative
 * references to point to — see app/files/[id]/[[...path]]/route.ts).
 *
 * macOS's Finder "Compress" command adds a __MACOSX/ metadata folder and a
 * "._name" resource-fork twin next to every real file; both are dropped
 * since they're never page content and would otherwise interfere with
 * picking the right entry page.
 */
export async function extractZipSite(buffer: ArrayBuffer): Promise<ExtractZipResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const entries = Object.values(zip.files)
    .map((entry) => ({ entry, path: entry.name.replace(/\\/g, "/") }))
    .filter(
      // Windows' own Compress-Archive cmdlet stores entries with backslash
      // separators instead of the ZIP-spec forward slash, so paths are
      // normalized above before anything checks or stores them.
      ({ entry, path }) =>
        !entry.dir && !path.startsWith("__MACOSX/") && !(path.split("/").pop() ?? "").startsWith("._")
    );

  if (entries.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const files: Record<string, UploadedFile> = {};
  const htmlPaths: string[] = [];

  for (const { entry, path } of entries) {
    const contentBase64 = await entry.async("base64");
    files[path] = { contentBase64, contentType: contentTypeForPath(path) };
    if (/\.html?$/i.test(path)) {
      htmlPaths.push(path);
    }
  }

  if (htmlPaths.length === 0) {
    return { ok: false, reason: "no-html" };
  }

  // Prefer an index.html, then the shallowest match, then alphabetical — a
  // stable, predictable pick when a zip has more than one .html file.
  htmlPaths.sort((a, b) => {
    const aIsIndex = /(^|\/)index\.html?$/i.test(a);
    const bIsIndex = /(^|\/)index\.html?$/i.test(b);
    if (aIsIndex !== bIsIndex) return aIsIndex ? -1 : 1;
    const depthDiff = a.split("/").length - b.split("/").length;
    if (depthDiff !== 0) return depthDiff;
    return a.localeCompare(b);
  });

  return { ok: true, value: { files, entryPath: htmlPaths[0] } };
}
