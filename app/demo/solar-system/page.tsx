"use client";

import { useState } from "react";

const PLANETS = [
  { name: "수성", emoji: "🪨", color: "bg-zinc-400", orbit: 70, duration: 4, fact: "태양에서 가장 가까운 행성이에요. 낮과 밤의 온도차가 극심해요." },
  { name: "금성", emoji: "🟠", color: "bg-amber-300", orbit: 100, duration: 6, fact: "표면 온도가 가장 뜨거운 행성이에요. 두꺼운 대기 때문이에요." },
  { name: "지구", emoji: "🌍", color: "bg-sky-400", orbit: 130, duration: 8, fact: "우리가 살고 있는 행성! 액체 물이 있는 유일한 행성이에요." },
  { name: "화성", emoji: "🔴", color: "bg-rose-400", orbit: 160, duration: 10, fact: "붉은 행성이라 불려요. 표면에 산화철이 많기 때문이에요." },
  { name: "목성", emoji: "🟤", color: "bg-orange-300", orbit: 195, duration: 14, fact: "태양계에서 가장 큰 행성이에요. 대적점이라는 거대한 폭풍이 있어요." },
];

export default function SolarSystemDemo() {
  const [selected, setSelected] = useState<(typeof PLANETS)[number] | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
        🎓 학생 예시 프로젝트 — 우주소년소녀단이 만든 인터랙티브 태양계 탐험이에요.
      </div>

      <h1 className="text-2xl font-bold">🪐 인터랙티브 태양계 탐험</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">행성을 클릭하면 정보 카드가 나타나요.</p>

      <div className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-zinc-950">
        <div className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-2xl shadow-[0_0_40px_10px_rgba(250,204,21,0.5)]">
          ☀️
        </div>
        {PLANETS.map((p) => (
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
              aria-label={`${p.name} 정보 보기`}
              className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.color} p-1.5 text-lg shadow-md transition hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            >
              {p.emoji}
            </button>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="flex flex-wrap justify-center gap-2">
        {PLANETS.map((p) => (
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
