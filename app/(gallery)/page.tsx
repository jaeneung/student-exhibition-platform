import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { format, getDictionary } from "@/lib/dictionary";
import { getCategoryFacets, getGradeFacets, getOnDisplayProjects, getTagFacets } from "@/lib/filters";
import { getLocale } from "@/lib/i18n";
import { getAllProjects, getPublicProjects } from "@/lib/store";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const params = await searchParams;
  const q = firstValue(params.q);
  const category = firstValue(params.category);
  const tag = firstValue(params.tag);
  const grade = firstValue(params.grade);

  const [projects, allProjects] = await Promise.all([
    getPublicProjects({ q, category, tag, grade }),
    getAllProjects(),
  ]);

  const categories = getCategoryFacets(allProjects);
  const tags = getTagFacets(allProjects);
  const grades = getGradeFacets(allProjects);
  const onDisplayCount = getOnDisplayProjects(allProjects).length;
  const hasAnyOnDisplay = onDisplayCount > 0;
  const hasActiveFilters = Boolean(q || category || tag || grade);

  return (
    <div className="flex flex-1 flex-col">
      <section className="hero-grid border-b border-zinc-200 bg-gradient-to-b from-brand-50 to-transparent dark:border-zinc-800 dark:from-brand-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-zinc-900 dark:text-brand-300 dark:ring-brand-900">
            {dict.gallery.badge}
          </span>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {dict.gallery.title}
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">{dict.gallery.subtitle}</p>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {format(dict.gallery.countLabel, { count: onDisplayCount })}
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
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
