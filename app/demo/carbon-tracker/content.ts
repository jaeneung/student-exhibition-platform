import type { Locale } from "@/lib/i18n";

interface Option {
  label: string;
  value: number;
  emoji: string;
}

export interface CarbonTrackerContent {
  badge: string;
  title: string;
  intro: string;
  transportLabel: string;
  transport: Option[];
  mealLabel: string;
  meals: Option[];
  screenTimeLabel: string;
  calcButton: string;
  resultLabel: string;
  tipLow: string;
  tipMid: string;
  tipHigh: string;
}

const ko: CarbonTrackerContent = {
  badge: "🎓 학생 예시 프로젝트 — 환경지킴이 동아리가 만든 탄소발자국 계산기예요.",
  title: "🌍 탄소발자국 계산기",
  intro: "오늘 하루 어떻게 보냈는지 선택하면 대략적인 탄소 배출 점수를 계산해 드려요.",
  transportLabel: "오늘 주로 이용한 교통수단",
  transport: [
    { label: "도보 / 자전거", value: 0, emoji: "🚲" },
    { label: "버스 / 지하철", value: 2, emoji: "🚌" },
    { label: "자가용", value: 5, emoji: "🚗" },
  ],
  mealLabel: "오늘 식사 스타일",
  meals: [
    { label: "채식 위주", value: 1, emoji: "🥗" },
    { label: "일반 식사", value: 3, emoji: "🍚" },
    { label: "고기 위주", value: 5, emoji: "🥩" },
  ],
  screenTimeLabel: "전자기기 사용 시간: {hours}시간",
  calcButton: "계산하기",
  resultLabel: "오늘의 예상 탄소 점수",
  tipLow: "훌륭해요! 오늘 하루 탄소 발자국이 낮은 편이에요. 🌱",
  tipMid: "평균적인 하루예요. 대중교통이나 도보를 조금 더 활용해 보세요. 🚌",
  tipHigh: "오늘은 탄소 배출이 좀 높았어요. 내일은 채식 한 끼, 대중교통 한 번 어때요? 🌍",
};

const en: CarbonTrackerContent = {
  badge: "🎓 Student example project — a carbon footprint calculator built by the Eco Club.",
  title: "🌍 Carbon Footprint Calculator",
  intro: "Tell us about your day and we'll estimate your carbon footprint score.",
  transportLabel: "Main transportation today",
  transport: [
    { label: "Walking / Bicycle", value: 0, emoji: "🚲" },
    { label: "Bus / Subway", value: 2, emoji: "🚌" },
    { label: "Car", value: 5, emoji: "🚗" },
  ],
  mealLabel: "Today's meal style",
  meals: [
    { label: "Mostly vegetarian", value: 1, emoji: "🥗" },
    { label: "Regular meals", value: 3, emoji: "🍚" },
    { label: "Mostly meat", value: 5, emoji: "🥩" },
  ],
  screenTimeLabel: "Screen time: {hours} hours",
  calcButton: "Calculate",
  resultLabel: "Today's estimated carbon score",
  tipLow: "Great job! Your carbon footprint today is on the lower side. 🌱",
  tipMid: "A pretty average day. Try using public transit or walking a bit more. 🚌",
  tipHigh: "Your carbon output was a bit high today. How about a vegetarian meal or public transit tomorrow? 🌍",
};

export function getCarbonTrackerContent(locale: Locale): CarbonTrackerContent {
  return locale === "en" ? en : ko;
}
