import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckLinksButton } from "@/components/CheckLinksButton";
import { EmptyState } from "@/components/EmptyState";
import { LinkBrokenBadge } from "@/components/LinkBrokenBadge";
import { ManagePrivateSection } from "@/components/ManagePrivateSection";
import { StatusBadge } from "@/components/StatusBadge";
import { getTeacherUsername, hasValidTeacherSession } from "@/lib/auth";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { format, getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { localizeProject } from "@/lib/projectLocalization";
import { getAllProjects } from "@/lib/store";
import { EXHIBITION_STATUSES, type ExhibitionStatus } from "@/lib/types";
import { changeStatusAction, logoutAction } from "../actions";

// "private" is rendered separately below via ManagePrivateSection (collapsible,
// bulk-select + delete) rather than through this generic loop.
const STATUS_ORDER: ExhibitionStatus[] = ["pending_review", "on_display"];

// Without this, Next.js's automatic static optimization prerenders this page
// once at build time (it has no searchParams/dynamic params to hint otherwise)
// and serves that snapshot forever — so submissions and status changes made
// after deploy would never show up here. Verified: this page built as a
// static (○) route until this was added, unlike every other page here.
export const dynamic = "force-dynamic";

export default async function ManagePage() {
  // Defense in depth: the layout above this page already redirects
  // unauthenticated visitors (see layout.tsx's comment for why the check has
  // to live there, not just here, on this specific route). Kept here too in
  // case this page is ever reached another way.
  if (!(await hasValidTeacherSession())) {
    redirect("/manage/login");
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const projects = (await getAllProjects()).map((p) => localizeProject(p, locale));
  const username = getTeacherUsername();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
            🗂️
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{dict.manage.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.manage.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {username && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {format(dict.manage.loggedInAs, { username })}
            </span>
          )}
          <div className="flex items-center gap-2">
            <CheckLinksButton dict={dict} />
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {dict.manage.logoutButton}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div
        role="status"
        className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <span aria-hidden="true">ℹ️</span>
        <p>
          <strong className="font-semibold">{dict.manage.mvpNoticeLabel} </strong>
          {dict.manage.mvpNoticeText}
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="🗂️" title={dict.manage.emptyTitle} message={dict.manage.emptyMessage} />
      ) : (
        STATUS_ORDER.map((status) => {
          const group = projects.filter((p) => p.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                {dict.status[status]} ({group.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {group.map((project) => {
                  const { icon } = getCategoryStyle(project.category);
                  return (
                    <li
                      key={project.id}
                      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-xl" aria-hidden="true">
                          {icon}
                        </span>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                              {project.title}
                            </span>
                            <LinkBrokenBadge linkStatus={project.linkStatus} dict={dict} locale={locale} />
                            <StatusBadge status={project.status} label={dict.status[project.status]} />
                            {!project.handsOnAvailable && (
                              <span className="text-xs text-zinc-500">{dict.card.handsOnPaused}</span>
                            )}
                          </div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {dict.categories[project.category] ?? project.category}
                            {project.grade ? ` · ${project.grade}` : ""} · {project.creatorName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/manage/${project.id}/edit`}
                          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {dict.manage.editLink}
                        </Link>
                        {EXHIBITION_STATUSES.filter((s) => s !== project.status).map((s) => (
                          <form key={s} action={changeStatusAction.bind(null, project.id, s)}>
                            <button
                              type="submit"
                              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              {format(dict.manage.switchTo, { status: dict.status[s] })}
                            </button>
                          </form>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {(() => {
        const privateProjects = projects.filter((p) => p.status === "private");
        if (privateProjects.length === 0) return null;
        return <ManagePrivateSection projects={privateProjects} dict={dict} locale={locale} />;
      })()}
    </div>
  );
}
