import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { hasValidTeacherSession } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getProjectByIdForManagement } from "@/lib/store";
import { updateProjectAction } from "../../actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // The reliable enforcement point: proxy.ts also checks this, but it's
  // stripped from the actual Netlify build (see proxy.ts's comment), so this
  // in-page check is what actually protects the deployed site.
  if (!(await hasValidTeacherSession())) {
    redirect("/manage/login");
  }

  const dict = getDictionary(await getLocale());
  const { id } = await params;
  // Deliberately not run through localizeProject: this form edits and saves
  // the canonical stored fields, so it must show (and write back) the actual
  // authored content — showing the English overlay here would mean saving
  // the form silently overwrites the Korean original with it.
  const project = await getProjectByIdForManagement(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/manage"
          className="w-fit text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          {dict.manage.backToManage}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
            ✏️
          </span>
          <a
            href={project.launchUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {dict.manage.previewLink}
          </a>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.manage.editTitle}</h1>
      </div>
      <ProjectForm
        dict={dict}
        action={updateProjectAction.bind(null, project.id)}
        project={project}
        includeStatus
        submitLabel={dict.manage.editSubmitLabel}
      />
    </div>
  );
}
