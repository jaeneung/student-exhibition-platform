"use client";

import { useState } from "react";
import { format } from "@/lib/dictionary";
import type { CarbonTrackerContent } from "./content";

export function CarbonTrackerDemo({ content }: { content: CarbonTrackerContent }) {
  const [transport, setTransport] = useState(1);
  const [meal, setMeal] = useState(1);
  const [screenHours, setScreenHours] = useState(4);
  const [result, setResult] = useState<number | null>(null);

  function calculate() {
    const transportScore = content.transport[transport].value;
    const mealScore = content.meals[meal].value;
    const screenScore = screenHours * 0.4;
    setResult(Math.round((transportScore + mealScore + screenScore) * 10) / 10);
  }

  const tip =
    result === null ? null : result < 5 ? content.tipLow : result < 9 ? content.tipMid : content.tipHigh;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        {content.badge}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{content.intro}</p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{content.transportLabel}</legend>
        <div className="flex gap-2">
          {content.transport.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTransport(i)}
              aria-pressed={transport === i}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                transport === i
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <span className="block text-xl">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{content.mealLabel}</legend>
        <div className="flex gap-2">
          {content.meals.map((m, i) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMeal(i)}
              aria-pressed={meal === i}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                meal === i
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <span className="block text-xl">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="screen" className="text-sm font-semibold">
          {format(content.screenTimeLabel, { hours: screenHours })}
        </label>
        <input
          id="screen"
          type="range"
          min={0}
          max={12}
          value={screenHours}
          onChange={(e) => setScreenHours(Number(e.target.value))}
          className="accent-emerald-600"
        />
      </div>

      <button
        type="button"
        onClick={calculate}
        className="h-12 rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700"
      >
        {content.calcButton}
      </button>

      {result !== null && (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{content.resultLabel}</p>
          <p className="text-4xl font-extrabold text-emerald-600">{result}</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{tip}</p>
        </div>
      )}
    </div>
  );
}
