import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { localizeProject } from "@/lib/projectLocalization";
import { getProjectsByOwner } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";
import { studentLogoutAction } from "../student/login/actions";

export const dynamic = "force-dynamic";

export default async function MyProjectsPage() {
  const studentId = await requireStudentSession("/my");
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const my = dict.my;
  const projects = (await getProjectsByOwner(studentId)).map((p) => localizeProject(p, locale));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
            aria-hidden="true"
          >
            🗂️
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{my.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{my.subtitle}</p>
        </div>
        <form action={studentLogoutAction}>
          <button
            type="submit"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {my.logoutButton}
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={my.emptyTitle}
          message={my.emptyMessage}
          action={
            <Link
              href="/submit"
              className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800"
            >
              {my.submitNewLink}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => {
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
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">{project.title}</span>
                      <StatusBadge status={project.status} label={dict.status[project.status]} />
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {dict.categories[project.category] ?? project.category}
                      {project.grade ? ` · ${project.grade}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(project.versions?.length ?? 0) > 0 && (
                    <Link
                      href={`/my/${project.id}/versions`}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {my.versionsLink}
                    </Link>
                  )}
                  <Link
                    href={`/my/${project.id}/edit`}
                    className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {my.editLink}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
