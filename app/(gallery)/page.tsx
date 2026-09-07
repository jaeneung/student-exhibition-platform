import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { getCategoryFacets, getOnDisplayProjects, getTagFacets } from "@/lib/filters";
import { getAllProjects, getPublicProjects } from "@/lib/store";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = firstValue(params.q);
  const category = firstValue(params.category);
  const tag = firstValue(params.tag);

  const [projects, allProjects] = await Promise.all([
    getPublicProjects({ q, category, tag }),
    getAllProjects(),
  ]);

  const categories = getCategoryFacets(allProjects);
  const tags = getTagFacets(allProjects);
  const onDisplayCount = getOnDisplayProjects(allProjects).length;
  const hasAnyOnDisplay = onDisplayCount > 0;
  const hasActiveFilters = Boolean(q || category || tag);

  return (
    <div className="flex flex-1 flex-col">
      <section className="hero-grid border-b border-zinc-200 bg-gradient-to-b from-brand-50 to-transparent dark:border-zinc-800 dark:from-brand-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-zinc-900 dark:text-brand-300 dark:ring-brand-900">
            ✨ Vibe Coding Showcase
          </span>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            학생들이 직접 만든 프로젝트를 만나보세요
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
            웹사이트, 게임, 앱, AI 챗봇, 인터랙티브 프로젝트까지 — 학생들이 vibe coding으로
            만든 작품을 둘러보고 직접 체험해 보세요.
          </p>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            현재 {onDisplayCount}개 프로젝트 전시중
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <SearchFilterBar q={q} category={category} tag={tag} categories={categories} tags={tags} />

        {!hasAnyOnDisplay ? (
          <EmptyState
            icon="🖼️"
            title="아직 전시중인 프로젝트가 없어요"
            message="곧 학생들의 멋진 프로젝트가 전시될 예정이에요. 잠시 후 다시 확인해 주세요."
          />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="검색 결과가 없어요"
            message="다른 검색어나 필터로 다시 시도해 보세요."
            action={
              hasActiveFilters ? (
                <Link
                  href="/"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  필터 초기화
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
