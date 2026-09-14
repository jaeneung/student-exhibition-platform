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
    fullDescription:
      "교통수단, 식사, 전자기기 사용 시간을 입력하면 대략적인 하루 탄소 배출량을 계산하고, 배출량을 줄이는 실천 방법을 제안합니다. 환경 동아리 프로젝트로 시작해 vibe coding으로 완성했습니다.",
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
        fullDescription:
          "Enter your transportation, meals, and screen time to get a rough estimate of your daily carbon footprint, along with suggestions for cutting it down. Started as an Eco Club project and finished with vibe coding.",
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
    fullDescription:
      "방향키로 캐릭터를 움직여 미로를 탈출하고, 갈림길마다 나오는 코딩 개념 퀴즈를 맞히면 지름길이 열립니다. 컴퓨터 동아리 학생 3명이 함께 만든 첫 게임 프로젝트입니다.",
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
        fullDescription:
          "Move your character with the arrow keys to escape the maze, and answer the coding-concept quiz at each fork to unlock a shortcut. The first game project made together by three Computer Club students.",
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
    fullDescription:
      "학교 급식 알리미 데이터를 흉내 낸 샘플 메뉴를 기반으로, 오늘의 급식과 비슷한 맛의 요리를 추천합니다. 급식을 더 즐겁게 기다릴 수 있도록 만든 앱입니다.",
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
        fullDescription:
          "Using sample menus modeled on a school lunch notification service, this app recommends dishes with a similar flavor to today's lunch — made to make waiting for lunch a little more fun.",
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
    fullDescription:
      "학생들이 부담 없이 고민을 털어놓을 수 있도록 만든 대화형 챗봇입니다. 상담 전문가의 조언을 대체하지 않으며, 공감과 정리된 조언 예시를 제공하는 데 중점을 두었습니다.",
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
        fullDescription:
          "A conversational chatbot made so students can share what's on their mind without pressure. It's not a substitute for a professional counselor's advice — the focus is on offering empathy and example advice.",
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
    fullDescription:
      "마우스나 터치로 태양계 행성을 회전, 확대하며 각 행성의 특징을 알아볼 수 있는 3D 웹 경험입니다. 과학 수행평가 프로젝트에서 출발해 전시용으로 다듬었습니다.",
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
        fullDescription:
          "A 3D web experience where you can rotate and zoom in on solar system planets with your mouse or touch to learn about each one. Started as a science performance-assessment project and polished for exhibition.",
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
    fullDescription:
      "관리자의 승인을 아직 받지 않은 상태를 보여주기 위한 샘플 프로젝트입니다. '심사 대기중' 상태는 관리 화면에서만 보이고, 방문자 갤러리에는 노출되지 않아야 합니다.",
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
        fullDescription:
          "A sample project that demonstrates the not-yet-approved state. A 'Pending Review' project should only be visible on the management screen, never in the visitor gallery.",
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
    fullDescription:
      "이 프로젝트는 '비공개' 상태의 예시입니다. 방문자용 갤러리와 상세 페이지 어디에서도 보이지 않아야 하며, 관리 화면에서만 확인할 수 있습니다.",
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
        fullDescription:
          "This project is an example of the 'Private' status. It must not appear anywhere in the visitor gallery or detail pages, and should only be viewable from the management screen.",
        creatorName: "Test Account",
        tags: ["test"],
      },
    },
  },
];
