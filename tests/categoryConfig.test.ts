import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-category-test-"));
  process.env.CATEGORY_CONFIG_DATA_FILE = path.join(tempDir, "category-rules.json");
});

afterEach(async () => {
  delete process.env.CATEGORY_CONFIG_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

describe("getCategoryRules", () => {
  it("returns the default rule for every category when nothing has been configured", async () => {
    const { getCategoryRules, DEFAULT_CATEGORY_RULE } = await import("@/lib/categoryConfig");
    const rules = await getCategoryRules();
    expect(Object.keys(rules).length).toBeGreaterThan(0);
    for (const rule of Object.values(rules)) {
      expect(rule).toEqual(DEFAULT_CATEGORY_RULE);
    }
  });

  it("round-trips a saved rule and leaves other categories at their defaults", async () => {
    const { getCategoryRules, saveCategoryRules, DEFAULT_CATEGORY_RULE } = await import("@/lib/categoryConfig");
    await saveCategoryRules({
      "웹사이트": { allowFileUpload: false, allowTitleOmission: true },
    });
    const rules = await getCategoryRules();
    expect(rules["웹사이트"]).toEqual({ allowFileUpload: false, allowTitleOmission: true });
    expect(rules["게임"]).toEqual(DEFAULT_CATEGORY_RULE);
  });

  it("ignores categories it doesn't know about when saving", async () => {
    const { getCategoryRules, saveCategoryRules } = await import("@/lib/categoryConfig");
    await saveCategoryRules({
      "존재하지 않는 카테고리": { allowFileUpload: false, allowTitleOmission: true },
    });
    const rules = await getCategoryRules();
    expect(rules["존재하지 않는 카테고리"]).toBeUndefined();
  });
});

describe("resolveTitle", () => {
  const omit = { allowFileUpload: true, allowTitleOmission: true };
  const require = { allowFileUpload: true, allowTitleOmission: false };

  it("uses the typed title when one is given", async () => {
    const { resolveTitle } = await import("@/lib/categoryConfig");
    expect(resolveTitle("내 작품", omit, "student1")).toBe("내 작품");
  });

  it("falls back to the username when the title is blank and omission is allowed", async () => {
    const { resolveTitle } = await import("@/lib/categoryConfig");
    expect(resolveTitle("", omit, "student1")).toBe("student1");
    expect(resolveTitle("   ", omit, "student1")).toBe("student1");
  });

  it("leaves a blank title blank when omission is not allowed, so validation still rejects it", async () => {
    const { resolveTitle } = await import("@/lib/categoryConfig");
    expect(resolveTitle("", require, "student1")).toBe("");
  });
});
