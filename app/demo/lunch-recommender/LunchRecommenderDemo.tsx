"use client";

import { useState } from "react";
import { format } from "@/lib/dictionary";
import type { LunchRecommenderContent } from "./content";

export function LunchRecommenderDemo({ content }: { content: LunchRecommenderContent }) {
  const [dayKey, setDayKey] = useState<string | null>(null);
  const data = dayKey ? content.days.find((d) => d.key === dayKey) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
        {content.badge}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{content.intro}</p>

      <div className="flex flex-wrap justify-center gap-2">
        {content.days.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDayKey(d.key)}
            aria-pressed={dayKey === d.key}
            className={`h-12 w-12 rounded-full text-base font-semibold transition ${
              dayKey === d.key
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            {d.key}
          </button>
        ))}
      </div>

      {data && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {format(content.cardTitle, { day: data.key })}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {data.menu.map((item) => (
                <li key={item} className="flex items-center gap-2 text-base">
                  <span aria-hidden="true">{data.emoji}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-200">
            {content.recommendPrefix}
            {data.recommend}
          </div>
        </div>
      )}
    </div>
  );
}
