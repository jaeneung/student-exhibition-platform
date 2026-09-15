import { describe, expect, it } from "vitest";
import { filterPublicProjects, getCategoryFacets, getGradeFacets, getTagFacets } from "@/lib/filters";
import type { Project } from "@/lib/types";

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: overrides.id ?? "id",
    title: "샘플 프로젝트",
    shortDescription: "짧은 소개",
    creatorName: "제작자",
    category: "웹사이트",
    tags: [],
    technologies: [],
    launchUrl: "https://example.com",
    status: "on_display",
    handsOnAvailable: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterPublicProjects", () => {
  it("shows only on_display projects, hiding pending_review and private", () => {
    const projects = [
      makeProject({ id: "1", status: "on_display" }),
      makeProject({ id: "2", status: "pending_review" }),
      makeProject({ id: "3", status: "private" }),
    ];

    const visible = filterPublicProjects(projects);

    expect(visible.map((p) => p.id)).toEqual(["1"]);
  });

  it("matches search text against title, short and full description, case-insensitively", () => {
    const projects = [
      makeProject({ id: "1", title: "탄소발자국 계산기" }),
      makeProject({ id: "2", title: "코드의 미로", shortDescription: "미로 탈출 게임" }),
      makeProject({ id: "3", title: "관계없는 프로젝트" }),
    ];

    expect(filterPublicProjects(projects, { q: "미로" }).map((p) => p.id)).toEqual(["2"]);
    expect(filterPublicProjects(projects, { q: "탄소" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("filters by exact category", () => {
    const projects = [
      makeProject({ id: "1", category: "게임" }),
      makeProject({ id: "2", category: "웹사이트" }),
    ];

    expect(filterPublicProjects(projects, { category: "게임" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("filters by tag membership", () => {
    const projects = [
      makeProject({ id: "1", tags: ["환경", "웹앱"] }),
      makeProject({ id: "2", tags: ["게임"] }),
    ];

    expect(filterPublicProjects(projects, { tag: "환경" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("combines search, category and tag filters together", () => {
    const projects = [
      makeProject({ id: "1", title: "탄소발자국 계산기", category: "웹사이트", tags: ["환경"] }),
      makeProject({ id: "2", title: "탄소 게임", category: "게임", tags: ["환경"] }),
    ];

    expect(
      filterPublicProjects(projects, { q: "탄소", category: "웹사이트", tag: "환경" }).map(
        (p) => p.id
      )
    ).toEqual(["1"]);
  });

  it("returns an empty array (no-results state) when nothing matches", () => {
    const projects = [makeProject({ id: "1" })];

    expect(filterPublicProjects(projects, { q: "존재하지않는검색어" })).toEqual([]);
  });

  it("returns an empty array when there are no projects at all (empty state)", () => {
    expect(filterPublicProjects([])).toEqual([]);
  });

  it("filters by grade, and leaves gradeless projects out of a grade-filtered result", () => {
    const projects = [
      makeProject({ id: "1", grade: "G6" }),
      makeProject({ id: "2", grade: "G7" }),
      makeProject({ id: "3" }), // no grade set
    ];

    expect(filterPublicProjects(projects, { grade: "G6" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("does not filter by grade when no grade filter is given", () => {
    const projects = [makeProject({ id: "1", grade: "G6" }), makeProject({ id: "2" })];

    expect(filterPublicProjects(projects).map((p) => p.id)).toEqual(["1", "2"]);
  });
});

describe("getCategoryFacets / getTagFacets / getGradeFacets", () => {
  it("only derive facets from on_display projects", () => {
    const projects = [
      makeProject({ id: "1", status: "on_display", category: "게임", tags: ["퍼즐"], grade: "G6" }),
      makeProject({ id: "2", status: "pending_review", category: "앱", tags: ["숨김"], grade: "G7" }),
      makeProject({ id: "3", status: "private", category: "AI 챗봇", tags: ["숨김2"], grade: "G8" }),
    ];

    expect(getCategoryFacets(projects)).toEqual(["게임"]);
    expect(getTagFacets(projects)).toEqual(["퍼즐"]);
    expect(getGradeFacets(projects)).toEqual(["G6"]);
  });

  it("orders grade facets G6→G9 regardless of insertion order", () => {
    const projects = [
      makeProject({ id: "1", grade: "G9" }),
      makeProject({ id: "2", grade: "G6" }),
      makeProject({ id: "3", grade: "G8" }),
    ];

    expect(getGradeFacets(projects)).toEqual(["G6", "G8", "G9"]);
  });

  it("returns no grade facets when nothing on display has a grade set", () => {
    const projects = [makeProject({ id: "1" })];
    expect(getGradeFacets(projects)).toEqual([]);
  });
});
