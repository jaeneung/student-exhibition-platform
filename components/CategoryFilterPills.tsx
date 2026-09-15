import Link from "next/link";
import type { Dictionary } from "@/lib/dictionary";

/** Quick one-click category switching, as a row of pills — the dropdown in
 * SearchFilterBar covers the same filter, but a visible All/Website/Game/…
 * row lets a visitor browse by category without opening a <select> first. */
export function CategoryFilterPills({
  dict,
  categories,
  active,
}: {
  dict: Dictionary;
  categories: string[];
  active?: string;
}) {
  const pillClass = (isActive: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      isActive
        ? "border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/30"
        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    }`;

  return (
    <div role="group" aria-label={dict.search.category} className="flex flex-wrap gap-2">
      <Link href="/" className={pillClass(!active)}>
        {dict.search.all}
      </Link>
      {categories.map((c) => (
        <Link key={c} href={`/?category=${encodeURIComponent(c)}`} className={pillClass(active === c)}>
          {dict.categories[c] ?? c}
        </Link>
      ))}
    </div>
  );
}
