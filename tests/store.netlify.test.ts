import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSubmissionInput } from "@/lib/types";

const blobData = new Map<string, unknown>();

vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    get: async (key: string) => blobData.get(key) ?? null,
    setJSON: async (key: string, value: unknown) => {
      blobData.set(key, value);
    },
  }),
}));

const baseSubmission: ProjectSubmissionInput = {
  title: "블롭 테스트 프로젝트",
  shortDescription: "Netlify Blobs 백엔드 테스트용 짧은 소개입니다.",
  fullDescription: "Netlify Blobs 백엔드 테스트용 상세 설명입니다.",
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
    process.env.NETLIFY = "true";
  });

  afterEach(() => {
    delete process.env.NETLIFY;
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
});
