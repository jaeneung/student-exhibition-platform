import Link from "next/link";
import { CategoryFilterPills } from "@/components/CategoryFilterPills";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/ProjectCard";
import { QrCode } from "@/components/QrCode";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { format, getDictionary } from "@/lib/dictionary";
import {
  filterPublicProjects,
  getGradeFacets,
  getOnDisplayProjects,
  getTagFacets,
} from "@/lib/filters";
import { getLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin";
import { localizeProject } from "@/lib/projectLocalization";
import { getAllProjects } from "@/lib/store";
import { PROJECT_CATEGORIES } from "@/lib/types";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const params = await searchParams;
  const q = firstValue(params.q);
  const category = firstValue(params.category);
  const tag = firstValue(params.tag);
  const grade = firstValue(params.grade);

  // Localized before filtering/faceting (not after) so that in English mode
  // the tag facets offered, the tag actually being filtered on, and the tag
  // text shown on cards are all the same English string — filtering by a
  // free-text field like tags only works if all three agree.
  const rawProjects = await getAllProjects();
  const allProjects = rawProjects.map((p) => localizeProject(p, locale));
  const projects = filterPublicProjects(allProjects, { q, category, tag, grade });

  // Every defined category, not just ones an on_display project currently
  // uses (unlike getTagFacets/getGradeFacets below, which are necessarily
  // data-driven) — so a category like CSA or 로보틱스 still shows up as a
  // filter option before the first project in it goes on display, instead
  // of silently disappearing from the gallery until then.
  const categories: string[] = [...PROJECT_CATEGORIES];
  const tags = getTagFacets(allProjects);
  const grades = getGradeFacets(allProjects);
  const onDisplayCount = getOnDisplayProjects(allProjects).length;
  const hasAnyOnDisplay = onDisplayCount > 0;
  const hasActiveFilters = Boolean(q || category || tag || grade);
  const homeUrl = `${await getRequestOrigin()}/`;

  return (
    <div className="flex flex-1 flex-col">
      <section className="hero-grid border-b border-zinc-200 bg-gradient-to-b from-brand-50 to-transparent dark:border-zinc-800 dark:from-brand-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-zinc-900 dark:text-brand-300 dark:ring-brand-900">
              {dict.gallery.badge}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {dict.gallery.title}
            </h1>
            <p className="text-base text-zinc-600 dark:text-zinc-400">{dict.gallery.subtitle}</p>
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {format(dict.gallery.countLabel, { count: onDisplayCount })}
            </p>
          </div>

          <div className="flex w-full max-w-[240px] shrink-0 flex-col items-center gap-2 self-center rounded-2xl border border-zinc-200 bg-white/80 p-4 text-center shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:self-auto">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{dict.mobileAccess.title}</p>
            <QrCode url={homeUrl} altText={dict.mobileAccess.qrAlt} caption={dict.mobileAccess.description} />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <CategoryFilterPills dict={dict} categories={categories} active={category} />

        <SearchFilterBar
          dict={dict}
          q={q}
          category={category}
          tag={tag}
          grade={grade}
          categories={categories}
          tags={tags}
          grades={grades}
        />

        {!hasAnyOnDisplay ? (
          <EmptyState icon="🖼️" title={dict.gallery.emptyTitle} message={dict.gallery.emptyMessage} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={dict.gallery.noResultsTitle}
            message={dict.gallery.noResultsMessage}
            action={
              hasActiveFilters ? (
                <Link
                  href="/"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {dict.gallery.clearFilters}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} dict={dict} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
