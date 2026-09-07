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
});

afterEach(async () => {
  delete process.env.PROJECTS_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

const baseSubmission: ProjectSubmissionInput = {
  title: "테스트 프로젝트",
  shortDescription: "테스트용 짧은 소개입니다.",
  fullDescription: "테스트용 상세 설명입니다.",
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
