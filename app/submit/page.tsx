import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { submitProjectAction } from "./actions";

export default function SubmitPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
          🚀
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">프로젝트 제출하기</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          6개 항목만 채우면 1분 안에 제출할 수 있어요. 제출한 프로젝트는 바로 전시되지 않고,
          선생님이 검토한 뒤 &apos;전시중&apos; 상태로 바뀌면 방문자에게 공개됩니다. 실명, 학번,
          이메일 등 개인정보는 적지 말고 팀 이름이나 별명을 사용해 주세요.
        </p>
        <Link
          href="/guide"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-950 dark:text-brand-300"
        >
          📖 처음이신가요? 제출 가이드 먼저 보기
        </Link>
      </div>
      <ProjectForm action={submitProjectAction} submitLabel="제출하기" />
    </div>
  );
}
