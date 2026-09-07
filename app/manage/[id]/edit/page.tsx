import { notFound } from "next/navigation";
import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { getProjectByIdForManagement } from "@/lib/store";
import { updateProjectAction } from "../../actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          ← 프로젝트 관리로 돌아가기
        </Link>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
          ✏️
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">프로젝트 수정</h1>
      </div>
      <ProjectForm
        action={updateProjectAction.bind(null, project.id)}
        project={project}
        includeStatus
        submitLabel="수정 저장"
      />
    </div>
  );
}
