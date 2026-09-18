import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSubmissionInput } from "@/lib/types";

const blobData = new Map<string, unknown>();
const getSpy = vi.fn(async (key: string) => blobData.get(key) ?? null);

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    get: getSpy,
    setJSON: async (key: string, value: unknown) => {
      blobData.set(key, value);
    },
    delete: async (key: string) => {
      blobData.delete(key);
    },
  }),
}));

const baseSubmission: ProjectSubmissionInput = {
  title: "블롭 테스트 프로젝트",
  shortDescription: "Netlify Blobs 백엔드 테스트용 짧은 소개입니다.",
  creatorName: "테스트 팀",
  category: "웹사이트",
  tags: ["테스트"],
  technologies: ["JavaScript"],
  launchUrl: "https://example.com/blobs-test",
  handsOnAvailable: true,
};

describe("store on Netlify (Blobs backend)", () => {
  beforeEach(() => {
    blobData.clear();
    getSpy.mockClear();
    process.env.NETLIFY_BLOBS_CONTEXT = "test-context";
    // lib/store.ts caches a read in module state for a few seconds (see its
    // comment) to avoid re-fetching Blobs on every request in production —
    // without resetting it here, that cache would carry a previous test's
    // data across into this one even after blobData.clear() above.
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NETLIFY_BLOBS_CONTEXT;
    vi.useRealTimers();
  });

  it("seeds from sample data on first read, same as the file backend", async () => {
    const { getAllProjects } = await import("@/lib/store");
    const all = await getAllProjects();
    expect(all.length).toBeGreaterThan(0);
  });

  it("persists a created project across subsequent reads", async () => {
    const { createProject, getAllProjects } = await import("@/lib/store");
    const created = await createProject(baseSubmission);
    const all = await getAllProjects();
    expect(all.some((p) => p.id === created.id)).toBe(true);
  });

  it("still forces new submissions to pending_review on this backend", async () => {
    const { createProject } = await import("@/lib/store");
    const created = await createProject(baseSubmission);
    expect(created.status).toBe("pending_review");
  });

  it("persists a status change made through updateProject", async () => {
    const { createProject, updateProject, getPublicProjectById } = await import("@/lib/store");
    const created = await createProject(baseSubmission);
    await updateProject(created.id, { ...baseSubmission, status: "on_display" });
    const found = await getPublicProjectById(created.id);
    expect(found?.status).toBe("on_display");
  });

  it("keeps uploaded content out of the main projects blob, in its own Blobs key", async () => {
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const created = await createProject({ ...baseSubmission, uploadedHtml: "<p>hi</p>" });

    const rawList = blobData.get("projects") as { id: string; uploadedHtml?: string }[];
    expect(rawList.find((p) => p.id === created.id)?.uploadedHtml).toBeUndefined();
    expect((blobData.get(created.id) as { uploadedHtml?: string })?.uploadedHtml).toBe("<p>hi</p>");

    const full = await getProjectByIdForManagement(created.id);
    expect(full?.uploadedHtml).toBe("<p>hi</p>");
  });

  it("migrates a pre-split record already sitting in Blobs (old format) on first read", async () => {
    const id = "44444444-4444-4444-4444-444444444444";
    blobData.set("projects", [
      {
        ...baseSubmission,
        id,
        status: "on_display",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uploadedHtml: "<p>legacy inline content</p>",
      },
    ]);

    const { getAllProjects, getProjectByIdForManagement } = await import("@/lib/store");
    const listed = await getAllProjects();
    expect(listed[0].uploadedHtml).toBeUndefined();

    const full = await getProjectByIdForManagement(id);
    expect(full?.uploadedHtml).toBe("<p>legacy inline content</p>");

    const storedList = blobData.get("projects") as { uploadedHtml?: string }[];
    expect(storedList[0].uploadedHtml).toBeUndefined();
  });

  it("removes a deleted project's content key too", async () => {
    const { createProject, deleteProjects } = await import("@/lib/store");
    const created = await createProject({ ...baseSubmission, uploadedHtml: "<p>hi</p>" });
    expect(blobData.has(created.id)).toBe(true);

    await deleteProjects([created.id]);
    expect(blobData.has(created.id)).toBe(false);
  });
});

describe("Blobs read caching (lib/store.ts's readAllFromBlobs)", () => {
  beforeEach(() => {
    blobData.clear();
    getSpy.mockClear();
    process.env.NETLIFY_BLOBS_CONTEXT = "test-context";
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.NETLIFY_BLOBS_CONTEXT;
    vi.useRealTimers();
  });

  it("serves a second read within the cache window from memory, without hitting Blobs again", async () => {
    const { getAllProjects } = await import("@/lib/store");
    await getAllProjects();
    expect(getSpy).toHaveBeenCalledTimes(1);
    await getAllProjects();
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  it("reads from Blobs again once the cache window has elapsed", async () => {
    vi.useFakeTimers();
    const { getAllProjects } = await import("@/lib/store");
    await getAllProjects();
    expect(getSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(16_000);
    await getAllProjects();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it("makes a project's own write visible immediately, without waiting for the cache to expire", async () => {
    const { createProject, getAllProjects } = await import("@/lib/store");
    await getAllProjects(); // populates the cache
    const created = await createProject(baseSubmission);
    const all = await getAllProjects();
    expect(all.some((p) => p.id === created.id)).toBe(true);
    // The write's own updated snapshot should answer this read directly —
    // not a stale cached read from before createProject ran.
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
