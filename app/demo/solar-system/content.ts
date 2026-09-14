import type { Locale } from "@/lib/i18n";

export interface Planet {
  name: string;
  emoji: string;
  color: string;
  orbit: number;
  duration: number;
  fact: string;
}

export interface SolarSystemContent {
  badge: string;
  title: string;
  intro: string;
  planetInfoAriaLabel: string;
  planets: Planet[];
}

const ko: SolarSystemContent = {
  badge: "🎓 학생 예시 프로젝트 — 우주소년소녀단이 만든 인터랙티브 태양계 탐험이에요.",
  title: "🪐 인터랙티브 태양계 탐험",
  intro: "행성을 클릭하면 정보 카드가 나타나요.",
  planetInfoAriaLabel: "{name} 정보 보기",
  planets: [
    { name: "수성", emoji: "🪨", color: "bg-zinc-400", orbit: 70, duration: 4, fact: "태양에서 가장 가까운 행성이에요. 낮과 밤의 온도차가 극심해요." },
    { name: "금성", emoji: "🟠", color: "bg-amber-300", orbit: 100, duration: 6, fact: "표면 온도가 가장 뜨거운 행성이에요. 두꺼운 대기 때문이에요." },
    { name: "지구", emoji: "🌍", color: "bg-sky-400", orbit: 130, duration: 8, fact: "우리가 살고 있는 행성! 액체 물이 있는 유일한 행성이에요." },
    { name: "화성", emoji: "🔴", color: "bg-rose-400", orbit: 160, duration: 10, fact: "붉은 행성이라 불려요. 표면에 산화철이 많기 때문이에요." },
    { name: "목성", emoji: "🟤", color: "bg-orange-300", orbit: 195, duration: 14, fact: "태양계에서 가장 큰 행성이에요. 대적점이라는 거대한 폭풍이 있어요." },
  ],
};

const en: SolarSystemContent = {
  badge: "🎓 Student example project — an interactive solar system explorer built by the Space Explorers Club.",
  title: "🪐 Interactive Solar System Explorer",
  intro: "Click a planet to see its info card.",
  planetInfoAriaLabel: "View info about {name}",
  planets: [
    { name: "Mercury", emoji: "🪨", color: "bg-zinc-400", orbit: 70, duration: 4, fact: "The closest planet to the Sun. It has extreme temperature swings between day and night." },
    { name: "Venus", emoji: "🟠", color: "bg-amber-300", orbit: 100, duration: 6, fact: "The hottest planet by surface temperature, due to its thick atmosphere." },
    { name: "Earth", emoji: "🌍", color: "bg-sky-400", orbit: 130, duration: 8, fact: "Our home planet! The only one known to have liquid water." },
    { name: "Mars", emoji: "🔴", color: "bg-rose-400", orbit: 160, duration: 10, fact: "Known as the Red Planet because of iron oxide on its surface." },
    { name: "Jupiter", emoji: "🟤", color: "bg-orange-300", orbit: 195, duration: 14, fact: "The largest planet in the solar system, home to a giant storm called the Great Red Spot." },
  ],
};

export function getSolarSystemContent(locale: Locale): SolarSystemContent {
  return locale === "en" ? en : ko;
}
