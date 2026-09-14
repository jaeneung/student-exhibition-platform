"use client";

import { useState } from "react";
import { format } from "@/lib/dictionary";
import type { Planet, SolarSystemContent } from "./content";

export function SolarSystemDemo({ content }: { content: SolarSystemContent }) {
  const [selected, setSelected] = useState<Planet | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
        {content.badge}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{content.intro}</p>

      <div className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-zinc-950">
        <div className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-2xl shadow-[0_0_40px_10px_rgba(250,204,21,0.5)]">
          ☀️
        </div>
        {content.planets.map((p) => (
          <div
            key={p.name}
            className="absolute rounded-full border border-white/10"
            style={{
              width: p.orbit * 2,
              height: p.orbit * 2,
              animation: `spin ${p.duration}s linear infinite`,
            }}
          >
            <button
              type="button"
              onClick={() => setSelected(p)}
              aria-label={format(content.planetInfoAriaLabel, { name: p.name })}
              className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.color} p-1.5 text-lg shadow-md transition hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            >
              {p.emoji}
            </button>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="flex flex-wrap justify-center gap-2">
        {content.planets.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSelected(p)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {selected && (
        <div role="status" className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-bold">
            {selected.emoji} {selected.name}
          </h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{selected.fact}</p>
        </div>
      )}
    </div>
  );
}
