import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormActionState } from "@/lib/formAction";

/**
 * Regression coverage for the bug fixed alongside this test: a category
 * rule turned off *after* a student already has a file/folder-based
 * project there must not block them from editing it, and must never
 * silently replace their real upload with whatever they're forced to type
 * into a now-required URL field. See app/my/actions.ts and
 * components/ProjectForm.tsx for the fix itself.
 *
 * These exercise the real updateOwnProjectAction server action end to end
 * (session check, rule lookup, launch-field resolution, storage) rather
 * than re-testing resolveTitle/categoryConfig in isolation (already covered
 * by tests/categoryConfig.test.ts) — only next/headers, next/navigation and
 * next/cache are mocked, since those need a real request context this test
 * doesn't have.
 */

let sessionCookie: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "student_session" && sessionCookie ? { value: sessionCookie } : undefined,
  }),
  // getRequestOrigin() (lib/origin.ts) reads this to build an uploaded
  // file's /files/{id} URL — same fallback host it uses outside a request.
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
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-upload-preservation-test-"));
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

const idleState: FormActionState = { status: "idle" };

function buildEditForm(overrides: Record<string, string> = {}) {
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
    launchMode: "url",
    launchUrl: "",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    form.set(key, value);
  }
  return form;
}

describe("updateOwnProjectAction — category rule changes vs. existing uploads", () => {
  it("lets a student save an unrelated edit after the category's file rule turns off, without touching the file", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { saveCategoryRules } = await import("@/lib/categoryConfig");
    const { updateOwnProjectAction } = await import("@/app/my/actions");

    const student = await createStudent("file_student_1", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      title: "Existing Upload Project",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "http://localhost/files/existing-id/index.html",
      uploadedFiles: {
        "index.html": { contentBase64: Buffer.from("<h1>hi</h1>").toString("base64"), contentType: "text/html" },
      },
      entryPath: "index.html",
      handsOnAvailable: true,
      ownerId: student.id,
    });

    // The teacher disables file uploads for this category *after* the
    // student already has one there.
    await saveCategoryRules({ "웹사이트": { allowFileUpload: false, allowTitleOmission: false } });

    const form = buildEditForm({
      title: original.title,
      shortDescription: "Updated an unrelated field after the rule changed.",
      category: "웹사이트",
      launchMode: "file", // what the edit page still submits for an upload-based project
    });
    const result = await updateOwnProjectAction(original.id, idleState, form);

    expect(result.status).toBe("success");
    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.shortDescription).toBe("Updated an unrelated field after the rule changed.");
    expect(saved?.uploadedFiles).toEqual(original.uploadedFiles);
    expect(saved?.launchUrl).toBe(original.launchUrl);
  });

  it("still lets the student replace their existing file with a new one while the rule is off, keeping the old one as a version", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement, getProjectVersionContent } = await import("@/lib/store");
    const { saveCategoryRules } = await import("@/lib/categoryConfig");
    const { updateOwnProjectAction } = await import("@/app/my/actions");

    const student = await createStudent("file_student_2", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      title: "Project To Replace",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "http://localhost/files/existing-id",
      uploadedHtml: "<h1>v1</h1>",
      handsOnAvailable: true,
      ownerId: student.id,
    });

    await saveCategoryRules({ "웹사이트": { allowFileUpload: false, allowTitleOmission: false } });

    const newFile = new File(["<h1>v2</h1>"], "new-version.html", { type: "text/html" });
    const form = buildEditForm({
      title: original.title,
      shortDescription: original.shortDescription,
      category: "웹사이트",
      launchMode: "file",
    });
    form.set("launchFile", newFile);

    const result = await updateOwnProjectAction(original.id, idleState, form);

    expect(result.status).toBe("success");
    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.uploadedHtml).toBe("<h1>v2</h1>");
    expect(saved?.versions).toHaveLength(1);
    // A version's own content lives in its own content-store entry, not
    // reattached by getProjectByIdForManagement (see lib/store.ts) — fetched
    // the same way the version-history page does.
    const versionContent = await getProjectVersionContent(original.id, saved!.versions![0].id);
    expect(versionContent?.uploadedHtml).toBe("<h1>v1</h1>");
  });

  it("still blocks turning a URL-only project into a brand-new file upload once the rule is off", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { saveCategoryRules } = await import("@/lib/categoryConfig");
    const { updateOwnProjectAction } = await import("@/app/my/actions");

    const student = await createStudent("file_student_3", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      title: "URL Only Project",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "https://example.com/original",
      handsOnAvailable: true,
      ownerId: student.id,
    });

    await saveCategoryRules({ "웹사이트": { allowFileUpload: false, allowTitleOmission: false } });

    const newFile = new File(["<h1>sneaking in a file</h1>"], "new.html", { type: "text/html" });
    const form = buildEditForm({
      title: original.title,
      shortDescription: original.shortDescription,
      category: "웹사이트",
      launchMode: "file",
    });
    form.set("launchFile", newFile);

    const result = await updateOwnProjectAction(original.id, idleState, form);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors?.launchFile).toBeTruthy();
    }
    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.launchUrl).toBe("https://example.com/original");
    expect(saved?.uploadedHtml).toBeUndefined();
  });

  it("re-enabling the rule later lets the student upload a new file again", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const { createStudentSessionToken } = await import("@/lib/studentAuth");
    const { createProject, getProjectByIdForManagement } = await import("@/lib/store");
    const { saveCategoryRules } = await import("@/lib/categoryConfig");
    const { updateOwnProjectAction } = await import("@/app/my/actions");

    const student = await createStudent("file_student_4", "password123");
    sessionCookie = createStudentSessionToken(student.id);

    const original = await createProject({
      title: "URL Project Upgrading To File",
      shortDescription: "A description that is definitely long enough.",
      creatorName: "Test Student",
      category: "웹사이트",
      tags: [],
      technologies: [],
      launchUrl: "https://example.com/original",
      handsOnAvailable: true,
      ownerId: student.id,
    });

    await saveCategoryRules({ "웹사이트": { allowFileUpload: true, allowTitleOmission: false } });

    const newFile = new File(["<h1>now allowed</h1>"], "allowed.html", { type: "text/html" });
    const form = buildEditForm({
      title: original.title,
      shortDescription: original.shortDescription,
      category: "웹사이트",
      launchMode: "file",
    });
    form.set("launchFile", newFile);

    const result = await updateOwnProjectAction(original.id, idleState, form);

    expect(result.status).toBe("success");
    const saved = await getProjectByIdForManagement(original.id);
    expect(saved?.uploadedHtml).toBe("<h1>now allowed</h1>");
  });
});
