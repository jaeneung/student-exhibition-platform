import type { Locale } from "@/lib/i18n";

export interface CodeMazeContent {
  badge: string;
  title: string;
  intro: string;
  moveUpLabel: string;
  moveDownLabel: string;
  moveLeftLabel: string;
  moveRightLabel: string;
  moveCountLabel: string;
  bonusQuizAriaLabel: string;
  bonusQuizPrefix: string;
  quiz: { question: string; options: string[]; answerIndex: number };
  quizCorrect: string;
  quizWrong: string;
  winMessage: string;
  retryButton: string;
}

const ko: CodeMazeContent = {
  badge: "🎓 학생 예시 프로젝트 — 컴퓨터 동아리 3인방이 만든 코딩 미로 게임이에요.",
  title: "🧩 코드의 미로",
  intro: "방향키(또는 아래 버튼)로 S에서 G까지 이동하세요. ⭐ 칸에서는 보너스 퀴즈가 나와요.",
  moveUpLabel: "위로 이동",
  moveDownLabel: "아래로 이동",
  moveLeftLabel: "왼쪽으로 이동",
  moveRightLabel: "오른쪽으로 이동",
  moveCountLabel: "이동 횟수: {count}",
  bonusQuizAriaLabel: "보너스 퀴즈",
  bonusQuizPrefix: "⭐ 보너스 퀴즈: ",
  quiz: {
    question: "다음 중 반복문(loop)을 나타내는 키워드는 무엇일까요?",
    options: ["if", "for", "return"],
    answerIndex: 1,
  },
  quizCorrect: "정답이에요! 🎉",
  quizWrong: '아쉬워요, 정답은 "{answer}"예요.',
  winMessage: "🎉 탈출 성공! {moves}번 만에 도착했어요.",
  retryButton: "다시 도전하기",
};

const en: CodeMazeContent = {
  badge: "🎓 Student example project — a coding maze game built by The Coding Trio.",
  title: "🧩 The Code Maze",
  intro: "Use the arrow keys (or the buttons below) to get from S to G. ⭐ squares have a bonus quiz.",
  moveUpLabel: "Move up",
  moveDownLabel: "Move down",
  moveLeftLabel: "Move left",
  moveRightLabel: "Move right",
  moveCountLabel: "Moves: {count}",
  bonusQuizAriaLabel: "Bonus quiz",
  bonusQuizPrefix: "⭐ Bonus quiz: ",
  quiz: {
    question: "Which of the following keywords represents a loop?",
    options: ["if", "for", "return"],
    answerIndex: 1,
  },
  quizCorrect: "That's correct! 🎉",
  quizWrong: 'Not quite — the correct answer was "{answer}".',
  winMessage: "🎉 You escaped! It took you {moves} moves.",
  retryButton: "Try again",
};

export function getCodeMazeContent(locale: Locale): CodeMazeContent {
  return locale === "en" ? en : ko;
}
