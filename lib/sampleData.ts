import type { Project } from "./types";

/**
 * Seed data for the exhibition. All projects, creators, and links here are
 * fictional and exist only to make the platform usable out of the box — this
 * is not real student data and is not persisted anywhere outside this file
 * until the app writes its working copy to data/projects.json.
 *
 * Each entry also carries an English `translations.en` overlay (see
 * lib/projectLocalization.ts) so switching the site to English shows fully
 * English sample content too, instead of leaving these fictional Korean
 * projects untranslated the way a real student's own submission would stay.
 */
const now = "2026-08-20T00:00:00.000Z";

// The 5 on_display samples link to small, real, working demo pages built into
// this same app (app/demo/*) instead of a dead placeholder, so "실행하기"
// (Launch) actually does something when visitors try it. Hardcoded to the
// deployed production URL — see README "배포" for the live address.
const DEMO_BASE_URL = "https://student-exhibition-platform.netlify.app";

export const sampleProjects: Project[] = [
  {
    id: "sample-carbon-tracker",
    title: "탄소발자국 계산기",
    shortDescription: "일상 소비 습관을 입력하면 하루 탄소 배출량을 계산해 주는 웹사이트예요.",
    creatorName: "환경지킴이 동아리",
    category: "웹사이트",
    tags: ["환경", "웹앱", "계산기"],
    coverImageUrl: undefined,
    motivation: "기후 위기에 대한 관심을 일상적인 행동 변화로 이어가고 싶어서 만들었습니다.",
    usageInstructions: "하단 입력창에 오늘의 이동 수단과 식사 종류를 선택하면 즉시 결과가 표시됩니다.",
    safetyNotes: undefined,
    technologies: ["HTML", "CSS", "JavaScript"],
    launchUrl: `${DEMO_BASE_URL}/demo/carbon-tracker`,
    status: "on_display",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Carbon Footprint Calculator",
        shortDescription: "A website that estimates your daily carbon footprint from your habits.",
        creatorName: "Eco Club",
        tags: ["environment", "web app", "calculator"],
        motivation: "Made to turn concern about the climate crisis into everyday behavior change.",
        usageInstructions: "Choose today's transportation and meal type in the form below to see your result instantly.",
        technologies: ["HTML", "CSS", "JavaScript"],
      },
    },
  },
  {
    id: "sample-code-maze",
    title: "코드의 미로",
    shortDescription: "제한 시간 안에 미로를 탈출하며 간단한 코딩 개념 퀴즈를 푸는 웹 게임이에요.",
    creatorName: "컴퓨터 동아리 3인방",
    category: "게임",
    tags: ["게임", "퀴즈", "코딩교육"],
    coverImageUrl: undefined,
    motivation: "코딩 수업 시간에 배운 개념을 게임으로 재미있게 복습할 방법을 고민하다 만들었습니다.",
    usageInstructions: "화면의 '시작하기' 버튼을 누른 뒤 방향키로 이동하고, 스페이스바로 정답을 선택하세요.",
    safetyNotes: "일부 효과음이 재생되니 헤드셋 사용을 권장합니다.",
    technologies: ["JavaScript", "Canvas API"],
    launchUrl: `${DEMO_BASE_URL}/demo/code-maze`,
    status: "on_display",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "The Code Maze",
        shortDescription: "A web game where you escape a maze against the clock while answering coding-concept quizzes.",
        creatorName: "The Coding Trio",
        tags: ["game", "quiz", "coding education"],
        motivation: "Made while thinking about how to turn concepts learned in coding class into a fun review game.",
        usageInstructions: "Move with the arrow keys or the on-screen buttons, and pick an answer when a bonus quiz appears.",
        safetyNotes: "Sound effects play during the game — headphones are recommended.",
        technologies: ["JavaScript", "Canvas API"],
      },
    },
  },
  {
    id: "sample-lunch-recommender",
    title: "급식 메뉴 추천 앱",
    shortDescription: "그날 급식 메뉴를 보고 비슷한 맛의 다른 음식을 추천해 주는 모바일 앱이에요.",
    creatorName: "맛있는하루 팀",
    category: "앱",
    tags: ["앱", "생활", "추천시스템"],
    coverImageUrl: undefined,
    motivation: "친구들이 급식 메뉴를 미리 궁금해하는 모습을 보고 아이디어를 얻었습니다.",
    usageInstructions: "앱을 열고 오늘 날짜를 선택하면 추천 메뉴 카드가 나타납니다. 카드를 눌러 상세 설명을 볼 수 있습니다.",
    safetyNotes: undefined,
    technologies: ["React Native", "Expo"],
    launchUrl: `${DEMO_BASE_URL}/demo/lunch-recommender`,
    status: "on_display",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Lunch Menu Recommender",
        shortDescription: "A mobile app that looks at today's school lunch and recommends other dishes with a similar taste.",
        creatorName: "Team Delicious Day",
        tags: ["app", "everyday life", "recommendation"],
        motivation: "Got the idea from seeing friends wonder about the lunch menu ahead of time.",
        usageInstructions: "Open the app and pick today's date to see a recommendation card. Tap the card for more detail.",
        technologies: ["React Native", "Expo"],
      },
    },
  },
  {
    id: "sample-maeumi-chatbot",
    title: "고민상담 AI 챗봇 '마음이'",
    shortDescription: "친구 관계나 학업 스트레스에 대해 편하게 이야기할 수 있는 AI 챗봇이에요.",
    creatorName: "마음이음 프로젝트팀",
    category: "AI 챗봇",
    tags: ["AI", "챗봇", "심리지원"],
    coverImageUrl: undefined,
    motivation: "또래 상담 동아리 활동 중 상담 대기 시간이 길다는 문제를 발견해 보완책으로 기획했습니다.",
    usageInstructions: "채팅창에 고민을 입력하면 챗봇이 공감하는 답변과 함께 참고할 만한 조언을 제시합니다.",
    safetyNotes: "이 챗봇은 전문 상담을 대체할 수 없습니다. 긴급한 어려움이 있다면 반드시 선생님이나 상담 선생님께 알려주세요.",
    technologies: ["Python", "AI API 연동"],
    launchUrl: `${DEMO_BASE_URL}/demo/maeumi-chatbot`,
    status: "on_display",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Maeumi — a Peer-Support AI Chatbot",
        shortDescription: "An AI chatbot for talking comfortably about friendship troubles or school stress.",
        creatorName: "Team Maeum-i-eum",
        tags: ["AI", "chatbot", "mental health support"],
        motivation: "Designed as a stopgap after noticing long wait times during peer-counseling club activities.",
        usageInstructions: "Type what's on your mind into the chat box, and the bot replies with empathy and example advice.",
        safetyNotes: "This chatbot cannot replace professional counseling. If you're facing something serious, please tell a teacher or school counselor.",
        technologies: ["Python", "AI API integration"],
      },
    },
  },
  {
    id: "sample-solar-system",
    title: "인터랙티브 태양계 탐험",
    shortDescription: "행성을 직접 클릭하고 돌려보며 태양계를 탐험하는 3D 인터랙티브 웹 경험이에요.",
    creatorName: "우주소년소녀단",
    category: "인터랙티브",
    tags: ["과학", "3D", "인터랙티브"],
    coverImageUrl: undefined,
    motivation: "교과서 그림만으로는 행성 크기와 거리 감각을 익히기 어려워 직접 조작할 수 있는 모델을 만들었습니다.",
    usageInstructions: "화면을 드래그해 시점을 돌리고, 행성을 터치하면 정보 카드가 나타납니다.",
    safetyNotes: undefined,
    technologies: ["Three.js", "WebGL"],
    launchUrl: `${DEMO_BASE_URL}/demo/solar-system`,
    status: "on_display",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Interactive Solar System Explorer",
        shortDescription: "A 3D interactive web experience for exploring the solar system by clicking and spinning the planets.",
        creatorName: "Space Explorers Club",
        tags: ["science", "3D", "interactive"],
        motivation: "Textbook illustrations alone made it hard to grasp planet sizes and distances, so we built a model you can actually manipulate.",
        usageInstructions: "Drag the screen to rotate the view, and tap a planet to see its info card.",
        technologies: ["Three.js", "WebGL"],
      },
    },
  },
  {
    id: "sample-weather-alert-pending",
    title: "날씨 알리미 (검토중 샘플)",
    shortDescription: "등하교 시간에 맞춰 우산이 필요한지 알려주는 미완성 웹앱이에요.",
    creatorName: "날씨연구소",
    category: "웹사이트",
    tags: ["날씨", "생활"],
    coverImageUrl: undefined,
    motivation: undefined,
    usageInstructions: undefined,
    safetyNotes: undefined,
    technologies: ["JavaScript"],
    launchUrl: "https://example.com/exhibits/weather-alert",
    status: "pending_review",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Weather Alert (Pending-Review Sample)",
        shortDescription: "An unfinished web app that tells you if you'll need an umbrella for your commute.",
        creatorName: "Weather Lab",
        tags: ["weather", "everyday life"],
        technologies: ["JavaScript"],
      },
    },
  },
  {
    id: "sample-private-test",
    title: "비공개 테스트 프로젝트 (샘플)",
    shortDescription: "비공개 상태가 방문자에게 노출되지 않는지 보여주기 위한 샘플이에요.",
    creatorName: "테스트 계정",
    category: "기타",
    tags: ["테스트"],
    coverImageUrl: undefined,
    motivation: undefined,
    usageInstructions: undefined,
    safetyNotes: undefined,
    technologies: [],
    launchUrl: "https://example.com/exhibits/private-test",
    status: "private",
    handsOnAvailable: true,
    createdAt: now,
    updatedAt: now,
    translations: {
      en: {
        title: "Private Test Project (Sample)",
        shortDescription: "A sample showing that a Private project stays hidden from visitors.",
        creatorName: "Test Account",
        tags: ["test"],
      },
    },
  },
];
