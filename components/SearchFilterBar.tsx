import Link from "next/link";

export function SearchFilterBar({
  q,
  category,
  tag,
  categories,
  tags,
}: {
  q?: string;
  category?: string;
  tag?: string;
  categories: string[];
  tags: string[];
}) {
  const hasActiveFilters = Boolean(q || category || tag);

  return (
    <form
      method="get"
      role="search"
      aria-label="전시 프로젝트 검색 및 필터"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <label htmlFor="q" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          검색
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          >
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17 17L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="프로젝트 제목이나 설명으로 검색"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 text-base transition focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="flex min-w-[140px] flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category ?? ""}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-base transition focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[140px] flex-col gap-1.5">
        <label htmlFor="tag" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          태그
        </label>
        <select
          id="tag"
          name="tag"
          defaultValue={tag ?? ""}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-base transition focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">전체</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-11 rounded-xl bg-brand-600 px-5 text-base font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          검색
        </button>
        {hasActiveFilters && (
          <Link
            href="/"
            className="flex h-11 items-center rounded-xl border border-zinc-300 px-4 text-base font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            필터 초기화
          </Link>
        )}
      </div>
    </form>
  );
}
