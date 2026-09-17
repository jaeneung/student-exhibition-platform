import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { filterPublicProjects } from "./filters";
import { isNetlifyRuntime } from "./runtime";
import { sampleProjects } from "./sampleData";
import type {
  Project,
  ProjectSubmissionInput,
  ProjectUpdateInput,
  PublicProjectFilters,
} from "./types";

/**
 * MVP persistence with two backends, chosen automatically at runtime:
 *
 * - Local dev (`npm run dev`/`next start`): a single JSON file on disk,
 *   seeded from lib/sampleData.ts on first read.
 * - Deployed on Netlify (`process.env.NETLIFY === "true"`, set by Netlify
 *   itself — never set locally): Netlify Blobs, a key-value store. This is
 *   required because Netlify Functions have no writable, shared filesystem —
 *   writes to local disk there are invisible to the next invocation (a
 *   different, possibly cold-started instance), so submissions and status
 *   changes would silently not persist without this.
 *
 * Neither backend is a real database: there is no schema migration, and
 * concurrent writes are last-write-wins (read-modify-write, not atomic).
 * Fine for a small school exhibition kiosk; replace with a real database
 * before higher-traffic or multi-editor production use (see README
 * "Limitations").
 */
const BLOB_STORE_NAME = "exhibition-projects";
const BLOB_KEY = "projects";

// Overridable so tests can point the file-backed store at a throwaway file
// instead of the real data/projects.json; production code never sets this.
function getDataFile(): string {
  return process.env.PROJECTS_DATA_FILE ?? path.join(process.cwd(), "data", "projects.json");
}

let writeQueue: Promise<unknown> = Promise.resolve();

// The path is only dynamic in tests (via PROJECTS_DATA_FILE); Turbopack can't
// prove that statically, so it would otherwise trace and bundle the whole
// project as a build dependency of these calls. turbopackIgnore opts out of
// that trace, which is safe here since the file is created/read at runtime,
// not part of the deployed source.
async function ensureDataFile(): Promise<void> {
  const dataFile = getDataFile();
  await mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await readFile(/* turbopackIgnore: true */ dataFile, "utf-8");
  } catch {
    await writeFile(
      /* turbopackIgnore: true */ dataFile,
      JSON.stringify(sampleProjects, null, 2),
      "utf-8"
    );
  }
}

async function readAllFromFile(): Promise<Project[]> {
  await ensureDataFile();
  const raw = await readFile(/* turbopackIgnore: true */ getDataFile(), "utf-8");
  return JSON.parse(raw) as Project[];
}

/** Serializes writes so two near-simultaneous submissions can't clobber each other. */
function writeAllToFile(projects: Project[]): Promise<void> {
  const task = writeQueue.then(() =>
    writeFile(
      /* turbopackIgnore: true */ getDataFile(),
      JSON.stringify(projects, null, 2),
      "utf-8"
    )
  );
  writeQueue = task.catch(() => undefined);
  return task;
}

async function readAllFromBlobsUncached(): Promise<Project[]> {
  const store = getStore(BLOB_STORE_NAME);
  const existing = await store.get(BLOB_KEY, { type: "json" });
  if (existing) return existing as Project[];
  await store.setJSON(BLOB_KEY, sampleProjects);
  return sampleProjects;
}

async function writeAllToBlobsUncached(projects: Project[]): Promise<void> {
  const store = getStore(BLOB_STORE_NAME);
  await store.setJSON(BLOB_KEY, projects);
}

// Every page that shows any project data — the gallery, a single project's
// page, /manage, /my — reads the *entire* collection over the network from
// Netlify Blobs, including every uploaded file's base64 content, even when
// all it needs is a title and a thumbnail link. As real submissions
// accumulate that read gets slower for everyone, on every single page view,
// regardless of how much of the payload that view actually uses (measured
// directly against the live site: a single project's detail page — a few
// KB of actual HTML — had the same ~1-1.2s of *added* latency over a
// data-free page as the full gallery grid did, which only makes sense if
// the cost is the read itself, not what gets rendered from it).
//
// Splitting large upload content out of this collection into its own
// per-project storage would fix this properly, but is a real migration of
// live production data — not something to do as a drive-by speed fix.
// Caching the parsed read in memory for a short window is a safe
// stand-in: Netlify Function containers are commonly reused across nearby
// requests (several visitors browsing within the same few seconds all
// land on the same warm instance), so this turns most of those repeat
// reads into a plain in-memory hit instead of a fresh network round trip.
// Scoped to the Blobs backend only — local dev's file-backed reads are
// already fast, and caching there would make manual edits to
// data/projects.json during development appear to do nothing for a while.
const BLOBS_CACHE_TTL_MS = 15_000;
let blobsCache: { data: Project[]; expiresAt: number } | undefined;

async function readAllFromBlobs(): Promise<Project[]> {
  if (blobsCache && Date.now() < blobsCache.expiresAt) {
    return blobsCache.data;
  }
  const data = await readAllFromBlobsUncached();
  blobsCache = { data, expiresAt: Date.now() + BLOBS_CACHE_TTL_MS };
  return data;
}

async function writeAllToBlobs(projects: Project[]): Promise<void> {
  await writeAllToBlobsUncached(projects);
  // Keeps *this* warm instance immediately consistent with its own write —
  // it would otherwise keep serving the pre-write snapshot from its cache
  // for up to BLOBS_CACHE_TTL_MS after making the change itself. A
  // different concurrent instance (or this one after the TTL) still only
  // catches up within that same window, same as any other short-lived cache.
  blobsCache = { data: projects, expiresAt: Date.now() + BLOBS_CACHE_TTL_MS };
}

function readAll(): Promise<Project[]> {
  return isNetlifyRuntime() ? readAllFromBlobs() : readAllFromFile();
}

function writeAll(projects: Project[]): Promise<void> {
  return isNetlifyRuntime() ? writeAllToBlobs(projects) : writeAllToFile(projects);
}

export async function getAllProjects(): Promise<Project[]> {
  return readAll();
}

/** Public gallery/search entry point. Always filters to "on_display" — this is
 * the server-side enforcement of the visibility rule, independent of the UI. */
export async function getPublicProjects(
  filters: PublicProjectFilters = {}
): Promise<Project[]> {
  const all = await readAll();
  return filterPublicProjects(all, filters);
}

/** Public detail-view lookup. Returns undefined for anything not on display,
 * including projects that exist but are pending/private, and unknown ids —
 * callers must not distinguish these cases in the response. */
export async function getPublicProjectById(id: string): Promise<Project | undefined> {
  const all = await readAll();
  return all.find((p) => p.id === id && p.status === "on_display");
}

/** Management lookup: any status, used only by the (unauthenticated, MVP-only)
 * management screens. See README for the auth gap this implies. */
export async function getProjectByIdForManagement(
  id: string
): Promise<Project | undefined> {
  const all = await readAll();
  return all.find((p) => p.id === id);
}

/** A logged-in student's own projects (app/my/**), any status — a student
 * needs to see and edit a project regardless of whether a teacher has
 * approved it yet, the same way getProjectByIdForManagement works for
 * teachers. Projects submitted before student accounts existed have no
 * ownerId and simply never appear here. */
export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const all = await readAll();
  return all.filter((p) => p.ownerId === ownerId);
}

function isDuplicateSubmission(
  existing: Project[],
  input: ProjectSubmissionInput
): boolean {
  // Matches on title + creator only, not launchUrl: an uploaded-file
  // submission gets a fresh /files/{id} address every time (see
  // resolveLaunchFields), so comparing URLs would never catch an accidental
  // double-submit of the same file.
  const RECENT_MS = 5 * 60 * 1000;
  const now = Date.now();
  return existing.some(
    (p) =>
      p.creatorName === input.creatorName &&
      p.title === input.title &&
      now - new Date(p.createdAt).getTime() < RECENT_MS
  );
}

/** Marker error only — the caller (app/submit/actions.ts) knows the visitor's
 * locale and supplies the actual user-facing message, so none is set here. */
export class DuplicateSubmissionError extends Error {
  constructor() {
    super("Duplicate submission");
    this.name = "DuplicateSubmissionError";
  }
}

/** Creates a new submission. Status is always forced to "pending_review" here —
 * the caller cannot set any other status through this function, which is what
 * makes exhibition-status enforcement a server rule rather than a UI convention.
 *
 * Accepts an optional pre-generated `id`: an uploaded-file submission's own
 * launchUrl is `/files/{id}`, which the caller (app/submit/actions.ts) has to
 * resolve *before* this function ever runs, so the id has to originate there
 * rather than inside this function as usual. */
export async function createProject(
  input: ProjectSubmissionInput,
  id: string = randomUUID()
): Promise<Project> {
  const all = await readAll();
  if (isDuplicateSubmission(all, input)) {
    throw new DuplicateSubmissionError();
  }
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id,
    status: "pending_review",
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...all, project]);
  return project;
}

export async function updateProject(
  id: string,
  input: ProjectUpdateInput
): Promise<Project | undefined> {
  const all = await readAll();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  const updated: Project = {
    ...all[index],
    ...input,
    id,
    updatedAt: new Date().toISOString(),
  };
  const next = [...all];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

/** Permanently removes the given projects. Returns the number actually
 * deleted (ids that don't exist are silently ignored). No confirmation or
 * status restriction happens here — callers (the /manage delete action) are
 * responsible for restricting this to the intended status/selection. */
export async function deleteProjects(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  const all = await readAll();
  const next = all.filter((p) => !idSet.has(p.id));
  const deletedCount = all.length - next.length;
  if (deletedCount > 0) {
    await writeAll(next);
  }
  return deletedCount;
}
