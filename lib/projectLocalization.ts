import type { Locale } from "./i18n";
import type { Project } from "./types";

/**
 * Overlays a project's `translations[locale]` fields (if any) onto its base
 * content for display. Real student submissions never set `translations`,
 * so this is a no-op for them — only this platform's own fictional seed data
 * (lib/sampleData.ts) uses it, so an English-locale visitor doesn't see
 * Korean sample content mixed into an otherwise-English page.
 *
 * `category`, `grade`, and `status` are deliberately untouched here: category
 * and status already have their own locale-aware display labels looked up
 * from the dictionary (dict.categories / dict.status) while the *value*
 * stays a stable canonical string used for filtering/storage; grade (G6-G9)
 * isn't language-specific at all.
 */
export function localizeProject(project: Project, locale: Locale): Project {
  const t = project.translations?.[locale as "en"];
  if (!t) return project;

  return {
    ...project,
    title: t.title ?? project.title,
    shortDescription: t.shortDescription ?? project.shortDescription,
    creatorName: t.creatorName ?? project.creatorName,
    tags: t.tags ?? project.tags,
    motivation: t.motivation ?? project.motivation,
    usageInstructions: t.usageInstructions ?? project.usageInstructions,
    safetyNotes: t.safetyNotes ?? project.safetyNotes,
    technologies: t.technologies ?? project.technologies,
  };
}
