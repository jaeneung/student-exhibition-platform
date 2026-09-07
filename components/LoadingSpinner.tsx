export function LoadingSpinner({ text }: { text: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-400" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}
