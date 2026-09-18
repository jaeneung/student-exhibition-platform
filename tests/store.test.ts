import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProjectSubmissionInput } from "@/lib/types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-store-test-"));
  process.env.PROJECTS_DATA_FILE = path.join(tempDir, "projects.json");
  process.env.PROJECT_CONTENT_DATA_FILE = path.join(tempDir, "project-content.json");
});

afterEach(async () => {
  delete process.env.PROJECTS_DATA_FILE;
  delete process.env.PROJECT_CONTENT_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

const baseSubmission: ProjectSubmissionInput = {
  title: "테스트 프로젝트",
  shortDescription: "테스트용 짧은 소개입니다.",
  creatorName: "테스트 팀",
  category: "웹사이트",
  tags: ["테스트"],
  technologies: ["JavaScript"],
  launchUrl: "https://example.com/test-project",
  handsOnAvailable: true,
};

describe("createProject", () => {
  it("always forces new submissions to pending_review, ignoring any status field", async () => {
    const { createProject } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    expect(project.status).toBe("pending_review");
  });

  it("assigns an id and timestamps", async () => {
    const { createProject } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    expect(project.id).toBeTruthy();
    expect(project.createdAt).toBeTruthy();
    expect(project.updatedAt).toBe(project.createdAt);
  });

  it("rejects a duplicate submission (same title/creator/url) submitted again immediately", async () => {
    const { createProject, DuplicateSubmissionError } = await import("@/lib/store");
    await createProject(baseSubmission);
    await expect(createProject(baseSubmission)).rejects.toBeInstanceOf(DuplicateSubmissionError);
  });

  it("allows a different project from the same creator", async () => {
    const { createProject } = await import("@/lib/store");
    await createProject(baseSubmission);
    const second = await createProject({
      ...baseSubmission,
      title: "다른 프로젝트",
      launchUrl: "https://example.com/other-project",
    });
    expect(second.title).toBe("다른 프로젝트");
  });

  it("uses a caller-supplied id instead of generating one, for uploaded-file submissions whose /files/{id} launchUrl must be known before the record is written", async () => {
    const { createProject } = await import("@/lib/store");
    const fixedId = "22222222-2222-2222-2222-222222222222";
    const project = await createProject(
      { ...baseSubmission, launchUrl: `https://example.com/files/${fixedId}`, uploadedHtml: "<p>hi</p>" },
      fixedId
    );
    expect(project.id).toBe(fixedId);
    expect(project.uploadedHtml).toBe("<p>hi</p>");
  });
});

describe("getPublicProjectById / getPublicProjects", () => {
  it("returns undefined for a project that exists but is not on_display", async () => {
    const { createProject, getPublicProjectById } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    // freshly created projects start as pending_review, so they must be invisible publicly
    expect(await getPublicProjectById(project.id)).toBeUndefined();
  });

  it("returns undefined for an unknown id, the same as a hidden project", async () => {
    const { getPublicProjectById } = await import("@/lib/store");
    expect(await getPublicProjectById(randomUUID())).toBeUndefined();
  });

  it("returns the project once its status is changed to on_display", async () => {
    const { createProject, updateProject, getPublicProjectById } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    await updateProject(project.id, { ...baseSubmission, status: "on_display" });
    const found = await getPublicProjectById(project.id);
    expect(found?.id).toBe(project.id);
    expect(found?.status).toBe("on_display");
  });

  it("excludes pending_review and private projects from the public gallery list", async () => {
    const { createProject, updateProject, getPublicProjects } = await import("@/lib/store");
    const pending = await createProject(baseSubmission);
    const toDisplay = await createProject({
      ...baseSubmission,
      title: "전시될 프로젝트",
      launchUrl: "https://example.com/on-display",
    });
    const toPrivate = await createProject({
      ...baseSubmission,
      title: "비공개 프로젝트",
      launchUrl: "https://example.com/private",
    });
    await updateProject(toDisplay.id, { ...baseSubmission, title: "전시될 프로젝트", status: "on_display" });
    await updateProject(toPrivate.id, { ...baseSubmission, title: "비공개 프로젝트", status: "private" });

    const publicList = await getPublicProjects();
    const ids = publicList.map((p) => p.id);
    expect(ids).toContain(toDisplay.id);
    expect(ids).not.toContain(pending.id);
    expect(ids).not.toContain(toPrivate.id);
  });
});

describe("updateProject", () => {
  it("changes exhibition status correctly and updates updatedAt", async () => {
    const { createProject, updateProject } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    const before = project.updatedAt;
    const updated = await updateProject(project.id, { ...baseSubmission, status: "on_display" });
    expect(updated?.status).toBe("on_display");
    expect(updated?.updatedAt).not.toBe(before);
  });

  it("returns undefined when updating an unknown id", async () => {
    const { updateProject } = await import("@/lib/store");
    const result = await updateProject(randomUUID(), { ...baseSubmission, status: "on_display" });
    expect(result).toBeUndefined();
  });
});

describe("deleteProjects", () => {
  it("removes the given projects and returns how many were deleted", async () => {
    const { createProject, deleteProjects, getAllProjects } = await import("@/lib/store");
    const first = await createProject(baseSubmission);
    const second = await createProject({ ...baseSubmission, title: "다른 프로젝트" });

    const deletedCount = await deleteProjects([first.id]);
    expect(deletedCount).toBe(1);

    const remaining = await getAllProjects();
    expect(remaining.map((p) => p.id)).not.toContain(first.id);
    expect(remaining.map((p) => p.id)).toContain(second.id);
  });

  it("ignores unknown ids and only counts ones that actually existed", async () => {
    const { createProject, deleteProjects } = await import("@/lib/store");
    const project = await createProject(baseSubmission);
    const deletedCount = await deleteProjects([project.id, randomUUID()]);
    expect(deletedCount).toBe(1);
  });

  it("returns 0 and does nothing for an empty id list", async () => {
    const { createProject, deleteProjects, getAllProjects } = await import("@/lib/store");
    await createProject(baseSubmission);
    const before = await getAllProjects();
    const deletedCount = await deleteProjects([]);
    expect(deletedCount).toBe(0);
    expect(await getAllProjects()).toHaveLength(before.length);
  });
});

describe("content storage split (lib/store.ts's own launch-content storage)", () => {
  it("keeps uploaded content out of the bulk list, but merges it back in for a single lookup", async () => {
    const { createProject, getAllProjects, getProjectByIdForManagement } = await import("@/lib/store");
    const created = await createProject({
      ...baseSubmission,
      uploadedFiles: { "index.html": { contentBase64: "aGVsbG8=", contentType: "text/html" } },
      entryPath: "index.html",
    });

    const all = await getAllProjects();
    const listed = all.find((p) => p.id === created.id);
    expect(listed?.uploadedFiles).toBeUndefined();

    const full = await getProjectByIdForManagement(created.id);
    expect(full?.uploadedFiles).toEqual({
      "index.html": { contentBase64: "aGVsbG8=", contentType: "text/html" },
    });
  });

  it("moves a version's content out of the list too, keeping only hasContent as a marker", async () => {
    const { createProject, getAllProjects, getProjectVersionContent, updateProject } = await import(
      "@/lib/store"
    );
    const created = await createProject({
      ...baseSubmission,
      uploadedHtml: "<p>v1</p>",
    });
    const versionId = "11111111-1111-1111-1111-111111111111";
    await updateProject(created.id, {
      ...baseSubmission,
      status: "pending_review",
      uploadedHtml: "<p>v2</p>",
      versions: [
        { id: versionId, savedAt: new Date().toISOString(), launchUrl: created.launchUrl, uploadedHtml: "<p>v1</p>" },
      ],
    });

    const all = await getAllProjects();
    const listed = all.find((p) => p.id === created.id);
    expect(listed?.versions).toHaveLength(1);
    expect(listed?.versions?.[0].uploadedHtml).toBeUndefined();
    expect(listed?.versions?.[0].hasContent).toBe(true);

    const versionContent = await getProjectVersionContent(created.id, versionId);
    expect(versionContent?.uploadedHtml).toBe("<p>v1</p>");
  });

  it("cleans up a deleted project's content and its versions' content", async () => {
    const { createProject, deleteProjects, getProjectVersionContent, updateProject } = await import(
      "@/lib/store"
    );
    const created = await createProject({ ...baseSubmission, uploadedHtml: "<p>current</p>" });
    const versionId = "22222222-2222-2222-2222-222222222222";
    await updateProject(created.id, {
      ...baseSubmission,
      status: "pending_review",
      uploadedHtml: "<p>new</p>",
      versions: [
        { id: versionId, savedAt: new Date().toISOString(), launchUrl: created.launchUrl, uploadedHtml: "<p>current</p>" },
      ],
    });

    await deleteProjects([created.id]);

    const { getProjectByIdForManagement } = await import("@/lib/store");
    expect(await getProjectByIdForManagement(created.id)).toBeUndefined();
    expect(await getProjectVersionContent(created.id, versionId)).toBeUndefined();
  });

  it("migrates a pre-split record (content still inline) transparently on first read", async () => {
    const { readFile, writeFile } = await import("node:fs/promises");
    const id = "33333333-3333-3333-3333-333333333333";
    const oldFormatProject = {
      ...baseSubmission,
      id,
      status: "on_display",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedHtml: "<p>legacy inline content</p>",
    };
    await writeFile(process.env.PROJECTS_DATA_FILE!, JSON.stringify([oldFormatProject], null, 2), "utf-8");

    const { getAllProjects, getProjectByIdForManagement } = await import("@/lib/store");
    const listed = await getAllProjects();
    // The migration should have stripped it out of the list read itself...
    expect(listed[0].uploadedHtml).toBeUndefined();
    // ...without losing it: a single lookup still finds the real content.
    const full = await getProjectByIdForManagement(id);
    expect(full?.uploadedHtml).toBe("<p>legacy inline content</p>");

    // And the migration actually rewrote the on-disk file, not just the
    // in-memory result — a second, independent read should find it already
    // stripped, with nothing left to migrate.
    const raw = await readFile(process.env.PROJECTS_DATA_FILE!, "utf-8");
    const stored = JSON.parse(raw);
    expect(stored[0].uploadedHtml).toBeUndefined();
  });
});

describe("updateLinkStatuses", () => {
  it("records ok/broken per project without touching unrelated projects", async () => {
    const { createProject, getAllProjects, updateLinkStatuses } = await import("@/lib/store");
    const working = await createProject(baseSubmission);
    const broken = await createProject({ ...baseSubmission, title: "깨진 링크 프로젝트" });
    const untouched = await createProject({ ...baseSubmission, title: "확인 안 한 프로젝트" });

    await updateLinkStatuses([
      { id: working.id, ok: true },
      { id: broken.id, ok: false },
    ]);

    const all = await getAllProjects();
    const byId = new Map(all.map((p) => [p.id, p]));
    expect(byId.get(working.id)?.linkStatus?.ok).toBe(true);
    expect(byId.get(broken.id)?.linkStatus?.ok).toBe(false);
    expect(byId.get(untouched.id)?.linkStatus).toBeUndefined();
  });

  it("applies every result in one combined write, so checking many projects at once can't lose one", async () => {
    const { createProject, getAllProjects, updateLinkStatuses } = await import("@/lib/store");
    const projects = [];
    for (let i = 0; i < 5; i += 1) {
      projects.push(
        await createProject({ ...baseSubmission, title: `프로젝트 ${i}`, launchUrl: `https://example.com/${i}` })
      );
    }

    await updateLinkStatuses(projects.map((p) => ({ id: p.id, ok: p.title !== "프로젝트 2" })));

    const all = await getAllProjects();
    for (const p of projects) {
      const found = all.find((x) => x.id === p.id);
      expect(found?.linkStatus?.ok).toBe(p.title !== "프로젝트 2");
    }
  });

  it("ignores an id that no longer exists", async () => {
    const { updateLinkStatuses } = await import("@/lib/store");
    await expect(updateLinkStatuses([{ id: randomUUID(), ok: false }])).resolves.toBeUndefined();
  });

  it("does nothing for an empty result list", async () => {
    const { createProject, getAllProjects, updateLinkStatuses } = await import("@/lib/store");
    await createProject(baseSubmission);
    const before = await getAllProjects();
    await updateLinkStatuses([]);
    expect(await getAllProjects()).toEqual(before);
  });
});

describe("getProjectsByOwner", () => {
  it("returns only the given owner's projects, any status", async () => {
    const { createProject, getProjectsByOwner, updateProject } = await import("@/lib/store");
    const owned = await createProject({ ...baseSubmission, ownerId: "student-1" });
    await updateProject(owned.id, { ...baseSubmission, ownerId: "student-1", status: "on_display" });
    await createProject({ ...baseSubmission, title: "다른 학생 프로젝트", ownerId: "student-2" });
    await createProject({ ...baseSubmission, title: "익명 프로젝트" });

    const mine = await getProjectsByOwner("student-1");
    expect(mine.map((p) => p.id)).toEqual([owned.id]);
    expect(mine[0].status).toBe("on_display");
  });

  it("returns an empty array for an owner with no projects", async () => {
    const { getProjectsByOwner } = await import("@/lib/store");
    expect(await getProjectsByOwner("nobody")).toEqual([]);
  });
});
