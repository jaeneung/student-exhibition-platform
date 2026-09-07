import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { getAllProjects } from "@/lib/store";
import { EXHIBITION_STATUS_LABELS, EXHIBITION_STATUSES, type ExhibitionStatus } from "@/lib/types";
import { changeStatusAction } from "../actions";

const STATUS_ORDER: ExhibitionStatus[] = ["pending_review", "on_display", "private"];

export default async function ManagePage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
          🗂️
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">프로젝트 관리</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          제출된 프로젝트를 검토하고 전시 상태를 바꿀 수 있어요.
        </p>
      </div>

      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
      >
        <span aria-hidden="true">⚠️</span>
        <p>
          <strong className="font-semibold">MVP 안내: </strong>
          이 관리 화면은 아직 로그인으로 보호되지 않아, 이 페이지 주소를 아는 누구나 접근할 수
          있습니다. 실제 학교 현장에서 사용하기 전에 반드시 교사 로그인 등 접근 제한을 추가해야
          합니다.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="아직 제출된 프로젝트가 없어요"
          message="학생이 프로젝트를 제출하면 여기에서 검토할 수 있어요."
        />
      ) : (
        STATUS_ORDER.map((status) => {
          const group = projects.filter((p) => p.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                {EXHIBITION_STATUS_LABELS[status]} ({group.length})
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
                            <StatusBadge status={project.status} />
                            {!project.handsOnAvailable && (
                              <span className="text-xs text-zinc-500">체험 일시중지</span>
                            )}
                          </div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {project.category} · {project.creatorName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/manage/${project.id}/edit`}
                          className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          상세 수정
                        </Link>
                        {EXHIBITION_STATUSES.filter((s) => s !== project.status).map((s) => (
                          <form key={s} action={changeStatusAction.bind(null, project.id, s)}>
                            <button
                              type="submit"
                              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              {EXHIBITION_STATUS_LABELS[s]}(으)로 전환
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
    </div>
  );
}
