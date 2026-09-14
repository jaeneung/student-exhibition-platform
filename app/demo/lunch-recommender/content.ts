import type { Locale } from "@/lib/i18n";

interface DayMenu {
  key: string;
  menu: string[];
  recommend: string;
  emoji: string;
}

export interface LunchRecommenderContent {
  badge: string;
  title: string;
  intro: string;
  cardTitle: string;
  recommendPrefix: string;
  days: DayMenu[];
}

const ko: LunchRecommenderContent = {
  badge: "🎓 학생 예시 프로젝트 — 맛있는하루 팀이 만든 급식 메뉴 추천 앱이에요.",
  title: "🍽️ 오늘의 급식 추천",
  intro: "요일을 선택하면 급식 메뉴와 추천 메뉴를 보여드려요.",
  cardTitle: "{day}요일 급식 카드",
  recommendPrefix: "💡 추천: ",
  days: [
    { key: "월", menu: ["잡곡밥", "된장찌개", "제육볶음", "콩나물무침"], recommend: "매콤한 떡볶이는 어때요?", emoji: "🍚" },
    { key: "화", menu: ["카레라이스", "미니돈까스", "단무지", "요구르트"], recommend: "카레를 좋아한다면 인도식 카레도 추천해요!", emoji: "🍛" },
    { key: "수", menu: ["짜장면", "군만두", "단무지", "치즈스틱"], recommend: "짜장면 좋아하면 짬뽕도 도전해 보세요.", emoji: "🍜" },
    { key: "목", menu: ["흰쌀밥", "미역국", "불고기", "시금치나물"], recommend: "불고기 덮밥으로 응용해도 맛있어요!", emoji: "🥩" },
    { key: "금", menu: ["김치볶음밥", "계란국", "탕수육", "쿨피스"], recommend: "탕수육 좋아하면 찹쌀탕수육도 추천!", emoji: "🍚" },
  ],
};

const en: LunchRecommenderContent = {
  badge: "🎓 Student example project — a lunch menu recommender app built by Team Delicious Day.",
  title: "🍽️ Today's Lunch Recommendation",
  intro: "Pick a day to see the lunch menu and a recommendation.",
  cardTitle: "{day} Lunch Card",
  recommendPrefix: "💡 Recommendation: ",
  days: [
    { key: "Mon", menu: ["Multigrain rice", "Soybean paste stew", "Stir-fried pork", "Seasoned bean sprouts"], recommend: "How about some spicy tteokbokki?", emoji: "🍚" },
    { key: "Tue", menu: ["Curry rice", "Mini pork cutlet", "Pickled radish", "Yogurt"], recommend: "If you like curry, try Indian-style curry too!", emoji: "🍛" },
    { key: "Wed", menu: ["Jjajangmyeon (black bean noodles)", "Fried dumplings", "Pickled radish", "Cheese sticks"], recommend: "If you like jjajangmyeon, give jjamppong a try.", emoji: "🍜" },
    { key: "Thu", menu: ["Steamed rice", "Seaweed soup", "Bulgogi", "Seasoned spinach"], recommend: "Try turning it into a bulgogi rice bowl — delicious!", emoji: "🥩" },
    { key: "Fri", menu: ["Kimchi fried rice", "Egg soup", "Sweet and sour pork", "Citron punch"], recommend: "If you like sweet and sour pork, try the glutinous rice version too!", emoji: "🍚" },
  ],
};

export function getLunchRecommenderContent(locale: Locale): LunchRecommenderContent {
  return locale === "en" ? en : ko;
}
