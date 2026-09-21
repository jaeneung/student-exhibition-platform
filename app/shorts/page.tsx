import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/ProjectCard";
import { format, getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { localizeProject } from "@/lib/projectLocalization";
import { getPublicProjects } from "@/lib/store";
import { SHORTS_CATEGORY } from "@/lib/types";

/**
 * A dedicated home for "민평통 숏폼" (short-form video) submissions,
 * deliberately separate from the main gallery ("/") rather than just one
 * more category filter there (see app/(gallery)/page.tsx, which excludes
 * this category entirely). Submissions still go through the ordinary
 * /submit form like everything else — a student picks this category and
 * pastes a link to a video they've already uploaded elsewhere (YouTube
 * Shorts, Instagram Reels, etc.); nothing about the submission/review
 * pipeline is special-cased, only where the result is *displayed*.
 */
// Without this, Next.js's automatic static optimization would prerender
// this page once at build time (it has no searchParams/dynamic params to
// hint otherwise, unlike the main gallery) and serve that snapshot forever —
// new shorts submissions would never show up. Same fix as /manage's list
// page; see that page's comment for how this was actually verified.
export const dynamic = "force-dynamic";

export default async function ShortsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const s = dict.shorts;

  const projects = (await getPublicProjects({ category: SHORTS_CATEGORY })).map((p) =>
    localizeProject(p, locale)
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="hero-grid border-b border-zinc-200 bg-gradient-to-b from-brand-50 to-transparent dark:border-zinc-800 dark:from-brand-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-zinc-900 dark:text-brand-300 dark:ring-brand-900">
            {s.badge}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {s.title}
          </h1>
          <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">{s.subtitle}</p>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {format(s.countLabel, { count: projects.length })}
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.howToTitle}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.howToBody}</p>
          </div>
          <Link
            href="/submit"
            className="inline-flex w-fit shrink-0 items-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {s.howToLink}
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState icon="🎬" title={s.emptyTitle} message={s.emptyMessage} />
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
