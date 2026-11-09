import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for restoreProjectVersionAction (app/my/actions.ts):
 * a student restoring an older launch-content snapshot must get that
 * version's file/link back as current, without losing the state it
 * replaced — that state must itself become a new version, not disappear.
 * Also checks the re-review rule (only forced when the project is currently
 * on_display) and that an unowned/unknown version is silently ignored.
 */

let sessionCookie: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "student_session" && sessionCookie ? { value: sessionCookie } : undefined,
  }),
  headers: async () => ({ get: (name: string) => (name === "host" ? "localhost:3000" : undefined) }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`unexpected redirect to ${url} — the test session should already be valid`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-version-restore-test-"));
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.PROJECTS_DATA_FILE = path.join(tempDir, "projects.json");
  process.env.PROJECT_CONTENT_DATA_FILE = path.join(tempDir, "project-content.json");
  process.env.STUDENTS_DATA_FILE = path.join(tempDir, "students.json");
  process.env.CATEGORY_CONFIG_DATA_FILE = path.join(tempDir, "category-rules.json");
  sessionCookie = undefined;
});

afterEach(async () => {
  delete process.env.SESSION_SECRET;
  delete process.env.PROJECTS_DATA_FILE;
  delete process.env.PROJECT_CONTENT_DATA_FILE;
  delete process.env.STUDENTS_DATA_FILE;
  delete process.env.CATEGORY_CONFIG_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

const baseSubmission = {
  title: "Version Restore Test",
  shortDescription: "A description that is definitely long enough.",
  creatorName: "Test Student",
  category: "웹사이트",
  tags: [],
  technologies: [],
  handsOnAvailable: true,
};

describe("restoreProjectVersionAction", () => {
  it("restores an older version's content and keeps the replaced state as a new version", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement, updateProject } = await import("@/lib/store");
    const { restoreProjectVersionAction } = await import("@/app/my/actions");

    const student = await createStudent("restore_student_1", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      ...baseSubmission,
      launchUrl: "http://localhost/files/original-id",
      uploadedHtml: "<h1>v1</h1>",
      ownerId: student.id,
    });

    // Simulate a later edit that replaces the content and snapshots v1,
    // the same way updateOwnProjectAction does.
    await updateProject(original.id, {
      ...baseSubmission,
      launchUrl: "http://localhost/files/original-id",
      uploadedHtml: "<h1>v2</h1>",
      status: "pending_review",
      ownerId: student.id,
      versions: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          savedAt: new Date().toISOString(),
          launchUrl: "http://localhost/files/original-id",
          uploadedHtml: "<h1>v1</h1>",
          hasContent: true,
        },
      ],
    });

    await restoreProjectVersionAction(original.id, "11111111-1111-1111-1111-111111111111");

    const restored = await getProjectByIdForManagement(original.id);
    expect(restored?.uploadedHtml).toBe("<h1>v1</h1>");
    // The restored-away v2 content must survive as a fresh version, not be
    // lost — restoring is itself non-destructive.
    expect(restored?.versions).toHaveLength(1);
    expect(restored?.versions?.[0].id).not.toBe("11111111-1111-1111-1111-111111111111");

    const { getProjectVersionContent } = await import("@/lib/store");
    const replacedContent = await getProjectVersionContent(original.id, restored!.versions![0].id);
    expect(replacedContent?.uploadedHtml).toBe("<h1>v2</h1>");
  });

  it("forces re-review when restoring on a currently on_display project", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement, updateProject } = await import("@/lib/store");
    const { restoreProjectVersionAction } = await import("@/app/my/actions");

    const student = await createStudent("restore_student_2", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      ...baseSubmission,
      launchUrl: "http://localhost/files/original-id-2",
      uploadedHtml: "<h1>v1</h1>",
      ownerId: student.id,
    });

    await updateProject(original.id, {
      ...baseSubmission,
      launchUrl: "http://localhost/files/original-id-2",
      uploadedHtml: "<h1>v2</h1>",
      status: "on_display",
      ownerId: student.id,
      versions: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          savedAt: new Date().toISOString(),
          launchUrl: "http://localhost/files/original-id-2",
          uploadedHtml: "<h1>v1</h1>",
          hasContent: true,
        },
      ],
    });

    await restoreProjectVersionAction(original.id, "22222222-2222-2222-2222-222222222222");

    const restored = await getProjectByIdForManagement(original.id);
    expect(restored?.status).toBe("pending_review");
  });

  it("does nothing when the version id doesn't exist", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { restoreProjectVersionAction } = await import("@/app/my/actions");

    const student = await createStudent("restore_student_3", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      ...baseSubmission,
      launchUrl: "https://example.com/current",
      ownerId: student.id,
    });

    await restoreProjectVersionAction(original.id, "no-such-version");

    const unchanged = await getProjectByIdForManagement(original.id);
    expect(unchanged?.launchUrl).toBe("https://example.com/current");
    expect(unchanged?.versions ?? []).toHaveLength(0);
  });

  it("does nothing when the project belongs to a different student", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement, updateProject } = await import("@/lib/store");
    const { restoreProjectVersionAction } = await import("@/app/my/actions");

    const owner = await createStudent("restore_owner", "password123");
    const attacker = await createStudent("restore_attacker", "password123");
    sessionCookie = createStudentSessionToken(attacker.id);

    const original = await createProject({
      ...baseSubmission,
      launchUrl: "http://localhost/files/owned-id",
      uploadedHtml: "<h1>v1</h1>",
      ownerId: owner.id,
    });
    await updateProject(original.id, {
      ...baseSubmission,
      launchUrl: "http://localhost/files/owned-id",
      uploadedHtml: "<h1>v2</h1>",
      status: "pending_review",
      ownerId: owner.id,
      versions: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          savedAt: new Date().toISOString(),
          launchUrl: "http://localhost/files/owned-id",
          uploadedHtml: "<h1>v1</h1>",
          hasContent: true,
        },
      ],
    });

    await restoreProjectVersionAction(original.id, "33333333-3333-3333-3333-333333333333");

    const unchanged = await getProjectByIdForManagement(original.id);
    expect(unchanged?.uploadedHtml).toBe("<h1>v2</h1>");
  });
});
