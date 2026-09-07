import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-4xl dark:bg-brand-950" aria-hidden="true">
        🔍
      </span>
      <h1 className="text-xl font-semibold">프로젝트를 찾을 수 없어요</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        요청하신 프로젝트가 없거나 현재 전시중이 아니에요.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        전시 둘러보기로 돌아가기
      </Link>
    </div>
  );
}
