import type { Project, PublicProjectFilters } from "./types";

/**
 * Enforces the public visibility rule (only "on_display" projects) and applies
 * search/category/tag filters on top. This is the single place that decides
 * what a general visitor may see, so it must be called by every public-facing
 * entry point (gallery page, detail page) rather than filtered again in the UI.
 */
export function filterPublicProjects(
  projects: Project[],
  filters: PublicProjectFilters = {}
): Project[] {
  const q = filters.q?.trim().toLowerCase();
  const category = filters.category?.trim();
  const tag = filters.tag?.trim();

  return projects
    .filter((project) => project.status === "on_display")
    .filter((project) => {
      if (!q) return true;
      return (
        project.title.toLowerCase().includes(q) ||
        project.shortDescription.toLowerCase().includes(q) ||
        project.fullDescription.toLowerCase().includes(q)
      );
    })
    .filter((project) => !category || project.category === category)
    .filter((project) => !tag || project.tags.includes(tag));
}

export function getOnDisplayProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === "on_display");
}

export function getCategoryFacets(projects: Project[]): string[] {
  const categories = getOnDisplayProjects(projects).map((p) => p.category);
  return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b, "ko"));
}

export function getTagFacets(projects: Project[]): string[] {
  const tags = getOnDisplayProjects(projects).flatMap((p) => p.tags);
  return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "ko"));
}
