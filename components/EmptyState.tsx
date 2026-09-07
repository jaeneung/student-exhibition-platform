import type { ReactNode } from "react";

export function EmptyState({
  icon = "📭",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-brand-950" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      {action}
    </div>
  );
}
