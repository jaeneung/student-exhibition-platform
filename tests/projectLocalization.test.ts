import { describe, expect, it } from "vitest";
import { localizeProject } from "@/lib/projectLocalization";
import type { Project } from "@/lib/types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "id",
    title: "한국어 제목",
    shortDescription: "한국어 짧은 소개",
    fullDescription: "한국어 상세 설명",
    creatorName: "한국어 제작자",
    category: "웹사이트",
    tags: ["한국어태그"],
    technologies: ["JavaScript"],
    launchUrl: "https://example.com",
    status: "on_display",
    handsOnAvailable: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("localizeProject", () => {
  it("returns the project unchanged for ko locale", () => {
    const project = makeProject({ translations: { en: { title: "English Title" } } });
    expect(localizeProject(project, "ko").title).toBe("한국어 제목");
  });

  it("returns the project unchanged when no translations are set, even for en locale (real student submissions)", () => {
    const project = makeProject();
    const localized = localizeProject(project, "en");
    expect(localized.title).toBe("한국어 제목");
    expect(localized.shortDescription).toBe("한국어 짧은 소개");
  });

  it("overlays only the fields present in the en translation, leaving the rest as-is", () => {
    const project = makeProject({
      translations: { en: { title: "English Title" } },
    });
    const localized = localizeProject(project, "en");
    expect(localized.title).toBe("English Title");
    // shortDescription has no override, so it falls back to the base value
    expect(localized.shortDescription).toBe("한국어 짧은 소개");
  });

  it("overlays all provided fields, including arrays", () => {
    const project = makeProject({
      tags: ["환경"],
      technologies: ["JavaScript"],
      translations: {
        en: {
          title: "Title",
          shortDescription: "Short",
          fullDescription: "Full",
          creatorName: "Creator",
          tags: ["environment"],
          technologies: ["JavaScript"],
        },
      },
    });
    const localized = localizeProject(project, "en");
    expect(localized.title).toBe("Title");
    expect(localized.shortDescription).toBe("Short");
    expect(localized.fullDescription).toBe("Full");
    expect(localized.creatorName).toBe("Creator");
    expect(localized.tags).toEqual(["environment"]);
  });

  it("never mutates the original project object", () => {
    const project = makeProject({ translations: { en: { title: "English Title" } } });
    const original = { ...project };
    localizeProject(project, "en");
    expect(project).toEqual(original);
  });

  it("leaves category, grade, and status untouched regardless of locale", () => {
    const project = makeProject({
      category: "웹사이트",
      grade: "G6",
      status: "on_display",
      translations: { en: { title: "English Title" } },
    });
    const localized = localizeProject(project, "en");
    expect(localized.category).toBe("웹사이트");
    expect(localized.grade).toBe("G6");
    expect(localized.status).toBe("on_display");
  });
});
