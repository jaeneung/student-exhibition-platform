import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getProjectByIdForManagement } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";
import { updateOwnProjectAction } from "../../actions";

export default async function EditOwnProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = await requireStudentSession(`/my/${id}/edit`);

  const dict = getDictionary(await getLocale());
  // Deliberately not run through localizeProject, same reasoning as the
  // teacher edit form: this saves back the canonical authored fields, so it
  // must show (and write) the real content, not an English overlay.
  const project = await getProjectByIdForManagement(id);

  if (!project || project.ownerId !== studentId) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/my"
          className="w-fit text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          {dict.my.backToMy}
        </Link>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          ✏️
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.my.editTitle}</h1>
        {(project.versions?.length ?? 0) > 0 && (
          <Link
            href={`/my/${id}/versions`}
            className="w-fit text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            {dict.my.versionsLink} →
          </Link>
        )}
      </div>
      <ProjectForm
        dict={dict}
        action={updateOwnProjectAction.bind(null, project.id)}
        project={project}
        submitLabel={dict.my.editSubmitLabel}
      />
    </div>
  );
}
