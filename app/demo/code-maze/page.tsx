"use client";

import { useEffect, useState } from "react";

// # wall, . path, S start, G goal, Q quiz bonus cell
const MAZE = [
  "#######",
  "#S..#.#",
  "#.#..Q#",
  "#.#.###",
  "#...#.#",
  "###.#.#",
  "#....G#",
  "#######",
];

const QUIZ = {
  question: "다음 중 반복문(loop)을 나타내는 키워드는 무엇일까요?",
  options: ["if", "for", "return"],
  answerIndex: 1,
};

function findChar(char: string) {
  for (let y = 0; y < MAZE.length; y++) {
    const x = MAZE[y].indexOf(char);
    if (x !== -1) return { x, y };
  }
  return { x: 0, y: 0 };
}

export default function CodeMazeDemo() {
  const start = findChar("S");
  const [pos, setPos] = useState(start);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  function tryMove(dx: number, dy: number) {
    if (won) return;
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    const cell = MAZE[ny]?.[nx];
    if (!cell || cell === "#") return;
    setPos({ x: nx, y: ny });
    setMoves((m) => m + 1);
    if (cell === "Q" && !quizDone) setShowQuiz(true);
    if (cell === "G") setWon(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") tryMove(0, -1);
      if (e.key === "ArrowDown") tryMove(0, 1);
      if (e.key === "ArrowLeft") tryMove(-1, 0);
      if (e.key === "ArrowRight") tryMove(1, 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, won, quizDone]);

  function reset() {
    setPos(start);
    setMoves(0);
    setWon(false);
    setShowQuiz(false);
    setQuizDone(false);
    setQuizFeedback(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-800 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200">
        🎓 학생 예시 프로젝트 — 컴퓨터 동아리 3인방이 만든 코딩 미로 게임이에요.
      </div>

      <h1 className="text-2xl font-bold">🧩 코드의 미로</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        방향키(또는 아래 버튼)로 <strong>S</strong>에서 <strong>G</strong>까지 이동하세요.
        <span className="text-amber-600"> ⭐ 칸</span>에서는 보너스 퀴즈가 나와요.
      </p>

      <div
        className="mx-auto grid gap-1 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
        style={{ gridTemplateColumns: `repeat(${MAZE[0].length}, minmax(0, 1fr))` }}
      >
        {MAZE.map((row, y) =>
          row.split("").map((cell, x) => {
            const isPlayer = pos.x === x && pos.y === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`flex h-8 w-8 items-center justify-center rounded text-sm sm:h-9 sm:w-9 ${
                  cell === "#"
                    ? "bg-zinc-800 dark:bg-zinc-700"
                    : cell === "G"
                      ? "bg-emerald-200 dark:bg-emerald-900"
                      : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {isPlayer ? "🧑" : cell === "G" ? "🏁" : cell === "Q" && !quizDone ? "⭐" : ""}
              </div>
            );
          })
        )}
      </div>

      <div className="mx-auto grid w-40 grid-cols-3 gap-1">
        <div />
        <button type="button" onClick={() => tryMove(0, -1)} className="rounded-lg bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label="위로 이동">↑</button>
        <div />
        <button type="button" onClick={() => tryMove(-1, 0)} className="rounded-lg bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label="왼쪽으로 이동">←</button>
        <button type="button" onClick={() => tryMove(0, 1)} className="rounded-lg bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label="아래로 이동">↓</button>
        <button type="button" onClick={() => tryMove(1, 0)} className="rounded-lg bg-zinc-900 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900" aria-label="오른쪽으로 이동">→</button>
      </div>

      <p className="text-center text-sm text-zinc-500">이동 횟수: {moves}</p>

      {showQuiz && !quizDone && (
        <div role="dialog" aria-label="보너스 퀴즈" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950">
          <p className="mb-3 font-semibold text-amber-900 dark:text-amber-200">⭐ 보너스 퀴즈: {QUIZ.question}</p>
          <div className="flex flex-wrap gap-2">
            {QUIZ.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setQuizDone(true);
                  setShowQuiz(false);
                  setQuizFeedback(i === QUIZ.answerIndex ? "정답이에요! 🎉" : `아쉬워요, 정답은 "${QUIZ.options[QUIZ.answerIndex]}"예요.`);
                }}
                className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-medium hover:bg-amber-100 dark:bg-zinc-900"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
      {quizFeedback && <p className="text-center text-sm font-medium">{quizFeedback}</p>}

      {won && (
        <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">🎉 탈출 성공! {moves}번 만에 도착했어요.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            다시 도전하기
          </button>
        </div>
      )}
    </div>
  );
}
