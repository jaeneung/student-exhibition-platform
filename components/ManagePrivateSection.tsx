"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { LinkBrokenBadge } from "@/components/LinkBrokenBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { format, type Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import { EXHIBITION_STATUSES, type Project } from "@/lib/types";
import { changeStatusAction, deleteProjectsAction } from "@/app/manage/actions";

export function ManagePrivateSection({
  projects,
  dict,
  locale,
}: {
  projects: Project[];
  dict: Dictionary;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const allIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(format(dict.manage.deleteSelectedConfirm, { count }))) return;

    const ids = Array.from(selectedIds);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await deleteProjectsAction(ids);
        setSelectedIds(new Set());
        setMessage({
          text: format(dict.manage.deleteSelectedSuccess, { count: result.deletedCount }),
          tone: "success",
        });
      } catch {
        setMessage({ text: dict.manage.deleteSelectedError, tone: "error" });
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <details
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
        className="group rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
          <h2 className="text-lg font-semibold">
            {dict.status.private} ({projects.length})
          </h2>
          <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {open ? dict.manage.privateCollapse : dict.manage.privateExpand}
            <span aria-hidden="true" className="text-base text-zinc-400 transition group-open:rotate-180">
              ⌄
            </span>
          </span>
        </summary>

        <div className="flex flex-col gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              {allSelected ? dict.manage.deselectAll : dict.manage.selectAll}
            </label>
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {format(dict.manage.selectedCount, { count: selectedIds.size })}
                </span>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={selectedIds.size === 0 || isPending}
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? dict.manage.deleteSelectedPending : dict.manage.deleteSelected}
              </button>
            </div>
          </div>

          {message && (
            <p
              role="status"
              className={
                message.tone === "success"
                  ? "text-sm text-emerald-700 dark:text-emerald-400"
                  : "text-sm text-red-700 dark:text-red-400"
              }
            >
              {message.text}
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {projects.map((project) => {
              const { icon } = getCategoryStyle(project.category);
              return (
                <li
                  key={project.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(project.id)}
                      onChange={() => toggleOne(project.id)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                    />
                    <span className="mt-0.5 text-xl" aria-hidden="true">
                      {icon}
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">{project.title}</span>
                        <LinkBrokenBadge linkStatus={project.linkStatus} dict={dict} locale={locale} />
                        <StatusBadge status={project.status} label={dict.status[project.status]} />
                        {!project.handsOnAvailable && (
                          <span className="text-xs text-zinc-500">{dict.card.handsOnPaused}</span>
                        )}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {dict.categories[project.category] ?? project.category}
                        {project.grade ? ` · ${project.grade}` : ""} · {project.creatorName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/manage/${project.id}/edit`}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {dict.manage.editLink}
                    </Link>
                    {EXHIBITION_STATUSES.filter((s) => s !== project.status).map((s) => (
                      <form key={s} action={changeStatusAction.bind(null, project.id, s)}>
                        <button
                          type="submit"
                          className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                        >
                          {format(dict.manage.switchTo, { status: dict.status[s] })}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </details>
    </section>
  );
}
