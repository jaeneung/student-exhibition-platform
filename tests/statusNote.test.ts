import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/dictionary";
import { getManagementSchema } from "@/lib/schema";
import { managementValuesToProjectFields } from "@/lib/formAction";
import type { FormActionState } from "@/lib/formAction";

/**
 * Regression coverage for the teacher-left status note (lib/types.ts's
 * Project.statusNote): a teacher setting a project to private/pending with
 * no explanation left the student with nothing but a bare status badge on
 * /my — see app/my/page.tsx and components/ProjectForm.tsx's status
 * section. Checked at three levels: the schema accepts/limits it, the
 * mapping function turns a blank textarea into "no note" rather than an
 * empty string, and the real teacher-facing actions round-trip it end to
 * end without a quick status-switch silently wiping it out (the same
 * "don't clobber a field you never showed" rule as the earlier category-
 * rule/upload-preservation fix — see tests/categoryRuleUploadPreservation.test.ts).
 */

describe("getManagementSchema — statusNote", () => {
  const dict = getDictionary("ko");
  const schema = getManagementSchema(dict);
  const base = {
    title: "테스트 프로젝트",
    shortDescription: "충분히 긴 설명을 적습니다.",
    creatorName: "테스트 학생",
    category: "웹사이트",
    technologies: "",
    handsOnAvailable: true,
    status: "private" as const,
  };

  it("accepts a project with no statusNote at all", () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it("accepts a short statusNote", () => {
    expect(schema.safeParse({ ...base, statusNote: "실행 링크를 확인해 주세요." }).success).toBe(true);
  });

  it("rejects a statusNote longer than 500 characters", () => {
    expect(schema.safeParse({ ...base, statusNote: "a".repeat(501) }).success).toBe(false);
  });
});

describe("managementValuesToProjectFields — statusNote", () => {
  const dict = getDictionary("ko");
  const schema = getManagementSchema(dict);
  const resolved = { launchUrl: "https://example.com", coverImageUrl: "https://example.com/cover.png" };

  it("carries a non-blank statusNote through", () => {
    const parsed = schema.parse({
      title: "테스트 프로젝트",
      shortDescription: "충분히 긴 설명을 적습니다.",
      creatorName: "테스트 학생",
      category: "웹사이트",
      technologies: "",
      handsOnAvailable: true,
      status: "private",
      statusNote: "실행 링크를 확인해 주세요.",
    });
    expect(managementValuesToProjectFields(parsed, resolved).statusNote).toBe(
      "실행 링크를 확인해 주세요."
    );
  });

  it("maps a blank statusNote to undefined, not an empty string", () => {
    const parsed = schema.parse({
      title: "테스트 프로젝트",
      shortDescription: "충분히 긴 설명을 적습니다.",
      creatorName: "테스트 학생",
      category: "웹사이트",
      technologies: "",
      handsOnAvailable: true,
      status: "private",
      statusNote: "",
    });
    expect(managementValuesToProjectFields(parsed, resolved).statusNote).toBeUndefined();
  });
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "teacher_session" && teacherCookie ? { value: teacherCookie } : undefined,
  }),
  headers: async () => ({ get: (name: string) => (name === "host" ? "localhost:3000" : undefined) }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`unexpected redirect to ${url} — the test teacher session should already be valid`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let teacherCookie: string | undefined;
let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-status-note-test-"));
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.TEACHER_USERNAME = "teacher";
  process.env.TEACHER_PASSWORD_SALT = "salt";
  process.env.TEACHER_PASSWORD_HASH = "hash";
  process.env.PROJECTS_DATA_FILE = path.join(tempDir, "projects.json");
  process.env.PROJECT_CONTENT_DATA_FILE = path.join(tempDir, "project-content.json");
  teacherCookie = undefined;
});

afterEach(async () => {
  delete process.env.SESSION_SECRET;
  delete process.env.TEACHER_USERNAME;
  delete process.env.TEACHER_PASSWORD_SALT;
  delete process.env.TEACHER_PASSWORD_HASH;
  delete process.env.PROJECTS_DATA_FILE;
  delete process.env.PROJECT_CONTENT_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

const idleState: FormActionState = { status: "idle" };

function buildManagementForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const defaults: Record<string, string> = {
    title: "My Cool Project",
    shortDescription: "A description that is definitely long enough.",
    creatorName: "Test Student",
    category: "웹사이트",
    grade: "",
    tags: "",
    coverImageUrl: "",
    motivation: "",
    usageInstructions: "",
    safetyNotes: "",
    technologies: "",
    handsOnAvailable: "on",
    status: "private",
    statusNote: "",
    launchMode: "url",
    launchUrl: "https://example.com",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    form.set(key, value);
  }
  return form;
}

describe("updateProjectAction / changeStatusAction — statusNote", () => {
  it("lets a teacher attach a note when setting a project private", async () => {
    const { createSessionToken } = await import("@/lib/auth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { updateProjectAction } = await import("@/app/manage/actions");

    teacherCookie = createSessionToken();

    const original = await createProject({
      title: "Needs Fixing",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "https://example.com/broken",
      handsOnAvailable: true,
    });

    const form = buildManagementForm({
      title: original.title,
      status: "private",
      statusNote: "실행 링크가 열리지 않아요. 다시 확인해서 올려주세요.",
    });
    const result = await updateProjectAction(original.id, idleState, form);

    expect(result.status).toBe("success");
    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.status).toBe("private");
    expect(saved?.statusNote).toBe("실행 링크가 열리지 않아요. 다시 확인해서 올려주세요.");
  });

  it("does not let a quick status-switch (changeStatusAction) wipe an existing note", async () => {
    const { createSessionToken } = await import("@/lib/auth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { updateProjectAction, changeStatusAction } = await import("@/app/manage/actions");

    teacherCookie = createSessionToken();

    const original = await createProject({
      title: "Needs Fixing 2",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "https://example.com/broken-2",
      handsOnAvailable: true,
    });

    const form = buildManagementForm({
      title: original.title,
      status: "private",
      statusNote: "다시 확인해 주세요.",
    });
    await updateProjectAction(original.id, idleState, form);

    // A teacher re-approving from the list view uses the one-click
    // changeStatusAction, which never shows or touches statusNote — it
    // must not silently clear what was already there.
    await changeStatusAction(original.id, "on_display");

    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.status).toBe("on_display");
    expect(saved?.statusNote).toBe("다시 확인해 주세요.");
  });

  it("clears the note when the teacher explicitly blanks it out and re-saves", async () => {
    const { createSessionToken } = await import("@/lib/auth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { updateProjectAction } = await import("@/app/manage/actions");

    teacherCookie = createSessionToken();

    const original = await createProject({
      title: "Fixed Now",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "https://example.com/fixed",
      handsOnAvailable: true,
      statusNote: "이전 메모",
    });

    const form = buildManagementForm({
      title: original.title,
      status: "on_display",
      statusNote: "",
    });
    await updateProjectAction(original.id, idleState, form);

    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.statusNote).toBeUndefined();
  });
});
