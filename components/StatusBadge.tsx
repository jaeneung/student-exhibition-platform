import type { ExhibitionStatus } from "@/lib/types";

const STYLES: Record<ExhibitionStatus, { badge: string; dot: string }> = {
  on_display: { badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-500" },
  pending_review: { badge: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-500" },
  private: { badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", dot: "bg-zinc-400" },
};

export function StatusBadge({ status, label }: { status: ExhibitionStatus; label: string }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
