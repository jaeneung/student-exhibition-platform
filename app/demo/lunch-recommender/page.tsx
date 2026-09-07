"use client";

import { useState } from "react";

const MENU: Record<string, { menu: string[]; recommend: string; emoji: string }> = {
  월: { menu: ["잡곡밥", "된장찌개", "제육볶음", "콩나물무침"], recommend: "매콤한 떡볶이는 어때요?", emoji: "🍚" },
  화: { menu: ["카레라이스", "미니돈까스", "단무지", "요구르트"], recommend: "카레를 좋아한다면 인도식 카레도 추천해요!", emoji: "🍛" },
  수: { menu: ["짜장면", "군만두", "단무지", "치즈스틱"], recommend: "짜장면 좋아하면 짬뽕도 도전해 보세요.", emoji: "🍜" },
  목: { menu: ["흰쌀밥", "미역국", "불고기", "시금치나물"], recommend: "불고기 덮밥으로 응용해도 맛있어요!", emoji: "🥩" },
  금: { menu: ["김치볶음밥", "계란국", "탕수육", "쿨피스"], recommend: "탕수육 좋아하면 찹쌀탕수육도 추천!", emoji: "🍚" },
};

const DAYS = Object.keys(MENU);

export default function LunchRecommenderDemo() {
  const [day, setDay] = useState<string | null>(null);
  const data = day ? MENU[day] : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
        🎓 학생 예시 프로젝트 — 맛있는하루 팀이 만든 급식 메뉴 추천 앱이에요.
      </div>

      <h1 className="text-2xl font-bold">🍽️ 오늘의 급식 추천</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">요일을 선택하면 급식 메뉴와 추천 메뉴를 보여드려요.</p>

      <div className="flex flex-wrap justify-center gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            aria-pressed={day === d}
            className={`h-12 w-12 rounded-full text-base font-semibold transition ${
              day === d
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {data && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{day}요일 급식 카드</h2>
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
            💡 추천: {data.recommend}
          </div>
        </div>
      )}
    </div>
  );
}
