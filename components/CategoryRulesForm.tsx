import { format, type Dictionary } from "@/lib/dictionary";
import { saveCategoryRulesAction } from "@/app/manage/actions";
import type { CategoryRule } from "@/lib/categoryConfig";

/** The teacher's per-category submission rules, rendered on /manage. Plain
 * form posting to a server action, so it works without any client state. */
export function CategoryRulesForm({
  dict,
  categories,
  rules,
  uploadCounts,
}: {
  dict: Dictionary;
  categories: string[];
  rules: Record<string, CategoryRule>;
  /** How many existing projects per category already have a file/folder
   * upload (see lib/store.ts's countUploadBasedProjects) — shown next to
   * the checkbox so a teacher can see who'd be affected *before* turning
   * file uploads off for a category, not after. */
  uploadCounts: Record<string, number>;
}) {
  const m = dict.manage;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{m.categoryRulesTitle}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.categoryRulesHint}</p>
      </div>
      <form action={saveCategoryRulesAction} className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                <th scope="col" className="py-2 pr-4 font-medium">{m.categoryRulesColumnCategory}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{m.categoryRulesColumnFile}</th>
                <th scope="col" className="py-2 font-medium">{m.categoryRulesColumnOmitTitle}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const rule = rules[category];
                const label = dict.categories[category] ?? category;
                const uploadCount = uploadCounts[category] ?? 0;
                return (
                  <tr key={category} className="border-b border-zinc-100 dark:border-zinc-800">
                    <th scope="row" className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{label}</th>
                    <td className="py-2 pr-4">
                      <div className="flex flex-col gap-1">
                        <input
                          type="checkbox"
                          name={`file:${category}`}
                          defaultChecked={rule.allowFileUpload}
                          aria-label={`${label}: ${m.categoryRulesColumnFile}`}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                        />
                        {uploadCount > 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            {format(m.categoryRulesUploadCount, { count: uploadCount })}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        name={`omit:${category}`}
                        defaultChecked={rule.allowTitleOmission}
                        aria-label={`${label}: ${m.categoryRulesColumnOmitTitle}`}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {m.categoryRulesSave}
          </button>
        </div>
      </form>
    </section>
  );
}
