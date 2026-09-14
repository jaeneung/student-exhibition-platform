import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProjectSubmissionInput } from "@/lib/types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-files-route-test-"));
  process.env.PROJECTS_DATA_FILE = path.join(tempDir, "projects.json");
});

afterEach(async () => {
  delete process.env.PROJECTS_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

const baseSubmission: ProjectSubmissionInput = {
  title: "업로드 테스트 프로젝트",
  shortDescription: "파일 업로드 테스트용 짧은 소개입니다.",
  fullDescription: "파일 업로드 테스트용 상세 설명입니다.",
  creatorName: "테스트 팀",
  category: "웹사이트",
  tags: [],
  technologies: [],
  launchUrl: "https://example.com/files/placeholder",
  handsOnAvailable: true,
};

describe("GET /files/[id] (single .html upload)", () => {
  it("serves an uploaded project's HTML content with the right headers", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    const project = await createProject({
      ...baseSubmission,
      uploadedHtml: "<html><body>Hello students</body></html>",
    });

    const response = await GET(new Request(`https://example.com/files/${project.id}`), {
      params: Promise.resolve({ id: project.id, path: undefined }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("<html><body>Hello students</body></html>");
  });

  it("returns 404 for a project that has no uploaded file (a URL-mode project)", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    const project = await createProject(baseSubmission);

    const response = await GET(new Request(`https://example.com/files/${project.id}`), {
      params: Promise.resolve({ id: project.id, path: undefined }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");

    const response = await GET(new Request("https://example.com/files/does-not-exist"), {
      params: Promise.resolve({ id: "does-not-exist", path: undefined }),
    });

    expect(response.status).toBe(404);
  });

  it("serves an uploaded project regardless of exhibition status (same trust boundary as an external link)", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    // createProject always starts a submission as pending_review, which is
    // exactly the status a freshly uploaded file sits in before a teacher
    // reviews it — this checks the file is still reachable at that point.
    const project = await createProject({
      ...baseSubmission,
      uploadedHtml: "<p>pending review</p>",
    });

    const response = await GET(new Request(`https://example.com/files/${project.id}`), {
      params: Promise.resolve({ id: project.id, path: undefined }),
    });

    expect(response.status).toBe(200);
  });

  it("ignores a stray path segment for a legacy single-file upload", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    const project = await createProject({
      ...baseSubmission,
      uploadedHtml: "<p>hi</p>",
    });

    const response = await GET(new Request(`https://example.com/files/${project.id}/images/4.png`), {
      params: Promise.resolve({ id: project.id, path: ["images", "4.png"] }),
    });

    expect(response.status).toBe(404);
  });
});

describe("GET /files/[id]/[...path] (.zip upload)", () => {
  it("serves the entry page at /files/{id} and an asset at its own nested path", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    const project = await createProject({
      ...baseSubmission,
      entryPath: "index.html",
      uploadedFiles: {
        "index.html": {
          contentBase64: Buffer.from("<img src='images/4.png'>").toString("base64"),
          contentType: "text/html; charset=utf-8",
        },
        "images/4.png": {
          contentBase64: Buffer.from("fake-png-bytes").toString("base64"),
          contentType: "image/png",
        },
      },
    });

    const entryResponse = await GET(new Request(`https://example.com/files/${project.id}`), {
      params: Promise.resolve({ id: project.id, path: undefined }),
    });
    expect(entryResponse.status).toBe(200);
    expect(entryResponse.headers.get("content-type")).toContain("text/html");
    expect(await entryResponse.text()).toBe("<img src='images/4.png'>");

    const assetResponse = await GET(
      new Request(`https://example.com/files/${project.id}/images/4.png`),
      { params: Promise.resolve({ id: project.id, path: ["images", "4.png"] }) }
    );
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await assetResponse.arrayBuffer()).toString()).toBe("fake-png-bytes");
  });

  it("returns 404 for a path not present in the uploaded files", async () => {
    const { createProject } = await import("@/lib/store");
    const { GET } = await import("@/app/files/[id]/[[...path]]/route");
    const project = await createProject({
      ...baseSubmission,
      entryPath: "index.html",
      uploadedFiles: {
        "index.html": {
          contentBase64: Buffer.from("<html></html>").toString("base64"),
          contentType: "text/html; charset=utf-8",
        },
      },
    });

    const response = await GET(
      new Request(`https://example.com/files/${project.id}/missing.png`),
      { params: Promise.resolve({ id: project.id, path: ["missing.png"] }) }
    );
    expect(response.status).toBe(404);
  });
});
