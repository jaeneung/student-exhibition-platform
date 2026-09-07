export function LaunchButton({
  url,
  available,
}: {
  url: string;
  available: boolean;
}) {
  if (!available) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-zinc-200 px-6 text-base font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
      >
        지금은 체험할 수 없어요
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-base font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      프로젝트 실행하기
      <span aria-hidden="true">↗</span>
      <span className="sr-only">(새 창에서 외부 사이트가 열립니다)</span>
    </a>
  );
}
