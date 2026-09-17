import { PROJECT_GRADES, type Project, type PublicProjectFilters } from "./types";

/**
 * Enforces the public visibility rule (only "on_display" projects) and applies
 * search/category/tag/grade filters on top. This is the single place that
 * decides what a general visitor may see, so it must be called by every
 * public-facing entry point (gallery page, detail page) rather than filtered
 * again in the UI.
 */
export function filterPublicProjects(
  projects: Project[],
  filters: PublicProjectFilters = {}
): Project[] {
  const q = filters.q?.trim().toLowerCase();
  const category = filters.category?.trim();
  const tag = filters.tag?.trim();
  const grade = filters.grade?.trim();

  return projects
    .filter((project) => project.status === "on_display")
    .filter((project) => {
      if (!q) return true;
      return (
        project.title.toLowerCase().includes(q) || project.shortDescription.toLowerCase().includes(q)
      );
    })
    .filter((project) => !category || project.category === category)
    .filter((project) => !tag || project.tags.includes(tag))
    .filter((project) => !grade || project.grade === grade);
}

export function getOnDisplayProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === "on_display");
}

export function getTagFacets(projects: Project[]): string[] {
  const tags = getOnDisplayProjects(projects).flatMap((p) => p.tags);
  return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "ko"));
}

/** Only the grades that actually have an on_display project, in G6→G9 order
 * (not alphabetical, since that happens to already match here but shouldn't
 * be relied on) — so the filter dropdown never offers a grade with nothing
 * behind it. */
export function getGradeFacets(projects: Project[]): string[] {
  const present = new Set(getOnDisplayProjects(projects).map((p) => p.grade));
  return PROJECT_GRADES.filter((g) => present.has(g));
}
