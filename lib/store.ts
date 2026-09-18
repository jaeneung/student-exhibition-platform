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
  ProjectContent,
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
 *
 * A project's own launch content — uploadedFiles/uploadedHtml, and the same
 * fields on each entry in `versions` — is deliberately kept OUT of the main
 * list below and stored separately (see the "content storage" section).
 * Every page that shows any project data (the gallery, a single project,
 * /manage, /my) used to read that content for *every* project just to
 * render a title and a thumbnail link, and it can be large: measured
 * directly against the live site, a single project's detail page had the
 * same ~1-1.2s of added latency over a data-free page as the full gallery
 * grid did, and the underlying blob turned out to hold several MB of
 * base64 file content across a few dozen projects. Splitting it out means
 * the list read stays small and fast regardless of how much students
 * upload; only the few call sites that actually need a project's own
 * content (edit forms, the file-serving routes) pay for fetching it, one
 * project at a time.
 */
const BLOB_STORE_NAME = "exhibition-projects";
const BLOB_KEY = "projects";
const CONTENT_BLOB_STORE_NAME = "exhibition-project-content";

// Overridable so tests can point the file-backed store at a throwaway file
// instead of the real data/projects.json; production code never sets this.
function getDataFile(): string {
  return process.env.PROJECTS_DATA_FILE ?? path.join(process.cwd(), "data", "projects.json");
}

function getContentDataFile(): string {
  return (
    process.env.PROJECT_CONTENT_DATA_FILE ?? path.join(process.cwd(), "data", "project-content.json")
  );
}

let writeQueue: Promise<unknown> = Promise.resolve();
let contentWriteQueue: Promise<unknown> = Promise.resolve();

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
  const projects = JSON.parse(raw) as Project[];
  return migrateInlineContentIfNeeded(projects, writeAllToFile);
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
  if (!existing) {
    await store.setJSON(BLOB_KEY, sampleProjects);
    return sampleProjects;
  }
  return migrateInlineContentIfNeeded(existing as Project[], writeAllToBlobsUncached);
}

async function writeAllToBlobsUncached(projects: Project[]): Promise<void> {
  const store = getStore(BLOB_STORE_NAME);
  await store.setJSON(BLOB_KEY, projects);
}

// Every page that shows any project data — the gallery, a single project's
// page, /manage, /my — reads the *entire* collection over the network from
// Netlify Blobs. Even with launch content split out (above), that read
// still crosses the network on every request. Caching the parsed result in
// memory for a short window is a cheap way to skip most of those repeat
// round trips: Netlify Function containers are commonly reused across
// nearby requests (several visitors browsing within the same few seconds
// all land on the same warm instance). Scoped to the Blobs backend only —
// local dev's file-backed reads are already fast, and caching there would
// make manual edits to data/projects.json during development appear to do
// nothing for a while.
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

// --- Content storage: a project's own launch content, and each of its
// versions' content, one key per piece, kept entirely separate from the
// lean list above. ---

async function ensureContentDataFile(): Promise<void> {
  const file = getContentDataFile();
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await readFile(/* turbopackIgnore: true */ file, "utf-8");
  } catch {
    await writeFile(/* turbopackIgnore: true */ file, "{}", "utf-8");
  }
}

async function readContentMapFromFile(): Promise<Record<string, ProjectContent>> {
  await ensureContentDataFile();
  const raw = await readFile(/* turbopackIgnore: true */ getContentDataFile(), "utf-8");
  return JSON.parse(raw) as Record<string, ProjectContent>;
}

async function getContentFromFile(key: string): Promise<ProjectContent | undefined> {
  const map = await readContentMapFromFile();
  return map[key];
}

/** Serialized the same way writeAllToFile is, so a content write racing an
 * unrelated content write can't drop one of them via a read-modify-write
 * clobber on this shared map file. */
function setContentToFile(key: string, content: ProjectContent): Promise<void> {
  const task = contentWriteQueue.then(async () => {
    const map = await readContentMapFromFile();
    map[key] = content;
    await writeFile(
      /* turbopackIgnore: true */ getContentDataFile(),
      JSON.stringify(map, null, 2),
      "utf-8"
    );
  });
  contentWriteQueue = task.catch(() => undefined);
  return task;
}

function deleteContentFromFile(key: string): Promise<void> {
  const task = contentWriteQueue.then(async () => {
    const map = await readContentMapFromFile();
    delete map[key];
    await writeFile(
      /* turbopackIgnore: true */ getContentDataFile(),
      JSON.stringify(map, null, 2),
      "utf-8"
    );
  });
  contentWriteQueue = task.catch(() => undefined);
  return task;
}

async function getContentFromBlobs(key: string): Promise<ProjectContent | undefined> {
  const store = getStore(CONTENT_BLOB_STORE_NAME);
  const value = await store.get(key, { type: "json" });
  return (value as ProjectContent | null) ?? undefined;
}

async function setContentToBlobs(key: string, content: ProjectContent): Promise<void> {
  const store = getStore(CONTENT_BLOB_STORE_NAME);
  await store.setJSON(key, content);
}

async function deleteContentFromBlobs(key: string): Promise<void> {
  const store = getStore(CONTENT_BLOB_STORE_NAME);
  await store.delete(key);
}

function getContent(key: string): Promise<ProjectContent | undefined> {
  return isNetlifyRuntime() ? getContentFromBlobs(key) : getContentFromFile(key);
}

function setContent(key: string, content: ProjectContent): Promise<void> {
  return isNetlifyRuntime() ? setContentToBlobs(key, content) : setContentToFile(key, content);
}

function deleteContent(key: string): Promise<void> {
  return isNetlifyRuntime() ? deleteContentFromBlobs(key) : deleteContentFromFile(key);
}

function versionContentKey(projectId: string, versionId: string): string {
  return `${projectId}:v:${versionId}`;
}

/** True when `project` (or any of its versions) still has launch content
 * embedded inline — the shape every record had before this split existed.
 * Drives the one-time, self-triggering migration in
 * migrateInlineContentIfNeeded below. */
function hasInlineContent(project: Project): boolean {
  if (project.uploadedFiles !== undefined || project.uploadedHtml !== undefined) return true;
  return (project.versions ?? []).some(
    (v) => v.uploadedFiles !== undefined || v.uploadedHtml !== undefined
  );
}

/** Splits one full Project (its own content and every version's content
 * still embedded, as every in-memory Project is constructed by callers)
 * into the lean record to keep in the main list, plus however many
 * separate content pieces need writing alongside it. */
function splitProjectForStorage(project: Project): {
  metadata: Project;
  writes: { key: string; content: ProjectContent }[];
} {
  const writes: { key: string; content: ProjectContent }[] = [];
  const { uploadedFiles, uploadedHtml, versions, ...rest } = project;

  if (uploadedFiles !== undefined || uploadedHtml !== undefined) {
    writes.push({ key: project.id, content: { uploadedFiles, uploadedHtml } });
  }

  const strippedVersions = versions?.map((version) => {
    const { uploadedFiles: versionFiles, uploadedHtml: versionHtml, ...versionRest } = version;
    // A version already stripped by an earlier split (no inline content
    // left to move) keeps whatever hasContent it was already given then —
    // only a version carrying fresh inline content right now needs it
    // computed anew.
    const hasContent = versionFiles !== undefined || versionHtml !== undefined;
    if (hasContent) {
      writes.push({
        key: versionContentKey(project.id, version.id),
        content: { uploadedFiles: versionFiles, uploadedHtml: versionHtml },
      });
    }
    return { ...versionRest, hasContent: hasContent || versionRest.hasContent };
  });

  return { metadata: { ...rest, versions: strippedVersions }, writes };
}

/** Writes out whatever content `project` carries inline, returning the lean
 * record with that content stripped — the one function every create/update/
 * migration path funnels through, so there's exactly one place that decides
 * what "own content" vs. "version content" means. */
async function persistProjectContent(project: Project): Promise<Project> {
  const { metadata, writes } = splitProjectForStorage(project);
  for (const { key, content } of writes) {
    await setContent(key, content);
  }
  return metadata;
}

/** Merges a lean, stored Project with its own separately-stored launch
 * content (not its versions' — see getProjectVersionContent for those),
 * so single-project lookups keep returning the exact same shape callers
 * relied on before this split existed. */
async function withOwnContent(project: Project): Promise<Project> {
  const content = await getContent(project.id);
  if (!content) return project;
  return { ...project, uploadedFiles: content.uploadedFiles, uploadedHtml: content.uploadedHtml };
}

/** One-time, self-triggering migration for records written before launch
 * content was split into separate storage — extracts each project's (and
 * each of its versions') embedded content into its own key, then rewrites
 * the main list without it. A no-op once nothing embeds content anymore.
 * Safe to run more than once, and safe if it runs concurrently on more
 * than one warm instance right after this code first deploys (worst case,
 * redundant writes of the same derived data): content is always written
 * before the metadata that stops referencing it inline, so a failure
 * partway through never loses anything — the original inline copy remains
 * the metadata's source of truth until the stripped rewrite itself
 * succeeds. */
async function migrateInlineContentIfNeeded(
  projects: Project[],
  writeRaw: (projects: Project[]) => Promise<void>
): Promise<Project[]> {
  if (!projects.some(hasInlineContent)) return projects;
  const stripped: Project[] = [];
  for (const project of projects) {
    stripped.push(await persistProjectContent(project));
  }
  await writeRaw(stripped);
  return stripped;
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
 * management screens. See README for the auth gap this implies. Unlike the
 * bulk lookups above, this merges the project's own launch content back in
 * (see withOwnContent) — the file-serving routes and the edit forms that
 * call this are exactly the places that actually need it. */
export async function getProjectByIdForManagement(
  id: string
): Promise<Project | undefined> {
  const all = await readAll();
  const project = all.find((p) => p.id === id);
  return project ? withOwnContent(project) : undefined;
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

/** One historical version's own content — the only place any version's
 * uploadedFiles/uploadedHtml ever gets read, since ordinary lookups
 * (including getProjectByIdForManagement) only ever merge in a project's
 * *current* content, not its past versions'. */
export async function getProjectVersionContent(
  projectId: string,
  versionId: string
): Promise<ProjectContent | undefined> {
  return getContent(versionContentKey(projectId, versionId));
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
  const metadata = await persistProjectContent(project);
  await writeAll([...all, metadata]);
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
  const metadata = await persistProjectContent(updated);
  const next = [...all];
  next[index] = metadata;
  await writeAll(next);
  return updated;
}

/** Permanently removes the given projects. Returns the number actually
 * deleted (ids that don't exist are silently ignored). No confirmation or
 * status restriction happens here — callers (the /manage delete action) are
 * responsible for restricting this to the intended status/selection.
 * Cleans up each deleted project's own content and every version's content
 * too, so deleting a project doesn't leave orphaned entries behind in the
 * content store. */
export async function deleteProjects(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  const all = await readAll();
  const toDelete = all.filter((p) => idSet.has(p.id));
  if (toDelete.length === 0) return 0;
  const next = all.filter((p) => !idSet.has(p.id));
  await writeAll(next);
  for (const project of toDelete) {
    await deleteContent(project.id);
    for (const version of project.versions ?? []) {
      await deleteContent(versionContentKey(project.id, version.id));
    }
  }
  return toDelete.length;
}
