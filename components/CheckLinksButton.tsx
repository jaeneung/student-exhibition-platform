"use client";

import { useState, useTransition } from "react";
import { format, type Dictionary } from "@/lib/dictionary";
import { checkAllProjectLinksAction } from "@/app/manage/actions";

/** Triggers a manual check of every project's launchUrl (see
 * app/manage/actions.ts's checkAllProjectLinksAction) and reports how many
 * came back broken. Deliberately not something that happens on page load —
 * checking dozens of URLs, some external, is real network time a teacher
 * has to choose to spend, not something every visit to /manage should
 * pay for. */
export function CheckLinksButton({ dict }: { dict: Dictionary }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      try {
        const { checkedCount, brokenCount } = await checkAllProjectLinksAction();
        setMessage({
          text:
            brokenCount === 0
              ? format(dict.manage.checkLinksResultOk, { checkedCount })
              : format(dict.manage.checkLinksResultBroken, { checkedCount, brokenCount }),
          tone: brokenCount === 0 ? "success" : "error",
        });
      } catch {
        setMessage({ text: dict.manage.checkLinksError, tone: "error" });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {isPending ? dict.manage.checkLinksPending : dict.manage.checkLinksButton}
      </button>
      {message && (
        <p
          role="status"
          className={
            message.tone === "success"
              ? "text-xs text-emerald-700 dark:text-emerald-400"
              : "text-xs text-rose-700 dark:text-rose-400"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
