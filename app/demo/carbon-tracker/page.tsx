"use client";

import { useState } from "react";

const TRANSPORT = [
  { label: "도보 / 자전거", value: 0, emoji: "🚲" },
  { label: "버스 / 지하철", value: 2, emoji: "🚌" },
  { label: "자가용", value: 5, emoji: "🚗" },
];

const MEALS = [
  { label: "채식 위주", value: 1, emoji: "🥗" },
  { label: "일반 식사", value: 3, emoji: "🍚" },
  { label: "고기 위주", value: 5, emoji: "🥩" },
];

export default function CarbonTrackerDemo() {
  const [transport, setTransport] = useState(1);
  const [meal, setMeal] = useState(1);
  const [screenHours, setScreenHours] = useState(4);
  const [result, setResult] = useState<number | null>(null);

  function calculate() {
    const transportScore = TRANSPORT[transport].value;
    const mealScore = MEALS[meal].value;
    const screenScore = screenHours * 0.4;
    setResult(Math.round((transportScore + mealScore + screenScore) * 10) / 10);
  }

  const tip =
    result === null
      ? null
      : result < 5
        ? "훌륭해요! 오늘 하루 탄소 발자국이 낮은 편이에요. 🌱"
        : result < 9
          ? "평균적인 하루예요. 대중교통이나 도보를 조금 더 활용해 보세요. 🚌"
          : "오늘은 탄소 배출이 좀 높았어요. 내일은 채식 한 끼, 대중교통 한 번 어때요? 🌍";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        🎓 학생 예시 프로젝트 — 환경지킴이 동아리가 만든 탄소발자국 계산기예요.
      </div>

      <h1 className="text-2xl font-bold">🌍 탄소발자국 계산기</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        오늘 하루 어떻게 보냈는지 선택하면 대략적인 탄소 배출 점수를 계산해 드려요.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">오늘 주로 이용한 교통수단</legend>
        <div className="flex gap-2">
          {TRANSPORT.map((t, i) => (
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
        <legend className="mb-1 text-sm font-semibold">오늘 식사 스타일</legend>
        <div className="flex gap-2">
          {MEALS.map((m, i) => (
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
          전자기기 사용 시간: {screenHours}시간
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
        계산하기
      </button>

      {result !== null && (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">오늘의 예상 탄소 점수</p>
          <p className="text-4xl font-extrabold text-emerald-600">{result}</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{tip}</p>
        </div>
      )}
    </div>
  );
}
