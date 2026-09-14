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
  mov: "video/quicktime",
  ogv: "video/ogg",
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

export type BuildSiteResult =
  | { ok: true; value: ExtractedSite }
  | { ok: false; reason: "empty" | "no-html" };

export type ExtractZipResult = BuildSiteResult | { ok: false; reason: "invalid" };

/** True for files that are never real page content and would otherwise
 * interfere with picking the right entry page: macOS Finder's "Compress"
 * command adds a __MACOSX/ metadata folder and a "._name" resource-fork
 * twin next to every real file, and OS file browsers leave their own
 * junk (Thumbs.db, desktop.ini, .DS_Store) inside folders they touch. */
function isJunkPath(path: string): boolean {
  const base = path.split("/").pop() ?? "";
  return (
    path.startsWith("__MACOSX/") ||
    base.startsWith("._") ||
    base === ".DS_Store" ||
    base === "Thumbs.db" ||
    base === "desktop.ini"
  );
}

/** Prefers an index.html, then the shallowest match, then alphabetical — a
 * stable, predictable pick when there's more than one .html file. */
function pickEntryPath(htmlPaths: string[]): string {
  const sorted = [...htmlPaths].sort((a, b) => {
    const aIsIndex = /(^|\/)index\.html?$/i.test(a);
    const bIsIndex = /(^|\/)index\.html?$/i.test(b);
    if (aIsIndex !== bIsIndex) return aIsIndex ? -1 : 1;
    const depthDiff = a.split("/").length - b.split("/").length;
    if (depthDiff !== 0) return depthDiff;
    return a.localeCompare(b);
  });
  return sorted[0];
}

/**
 * Builds the {files, entryPath} shape shared by every "here's a whole site,
 * not just one file" upload path (a .zip's contents, or a browser folder
 * picker's file list) from a flat list of already-read {path, contentBase64}
 * entries. Every folder is preserved exactly as given: a student's page
 * referencing "images/4.png" or "../images/4.png" only resolves correctly
 * once served back out at that same relative path (see
 * app/files/[id]/[[...path]]/route.ts).
 */
export function buildSiteFromEntries(
  entries: { path: string; contentBase64: string }[]
): BuildSiteResult {
  const filtered = entries.filter((e) => !isJunkPath(e.path));
  if (filtered.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const files: Record<string, UploadedFile> = {};
  const htmlPaths: string[] = [];

  for (const { path, contentBase64 } of filtered) {
    files[path] = { contentBase64, contentType: contentTypeForPath(path) };
    if (/\.html?$/i.test(path)) {
      htmlPaths.push(path);
    }
  }

  if (htmlPaths.length === 0) {
    return { ok: false, reason: "no-html" };
  }

  return { ok: true, value: { files, entryPath: pickEntryPath(htmlPaths) } };
}

/**
 * Extracts a `.zip` upload into the same {files, entryPath} shape (see
 * buildSiteFromEntries) — accepting a .zip instead of a lone .html file is
 * what lets a page's own relative image/CSS/JS references resolve
 * correctly at all, since a single uploaded file has nowhere for those
 * references to point to.
 *
 * Windows' own Compress-Archive cmdlet stores entries with backslash
 * separators instead of the ZIP-spec forward slash, so paths are
 * normalized before anything checks or stores them.
 */
export async function extractZipSite(buffer: ArrayBuffer): Promise<ExtractZipResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const entries = await Promise.all(
    Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map(async (entry) => ({
        path: entry.name.replace(/\\/g, "/"),
        contentBase64: await entry.async("base64"),
      }))
  );

  return buildSiteFromEntries(entries);
}
