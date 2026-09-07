"use client";

import { useState } from "react";

type Message = { from: "user" | "bot"; text: string };

const RULES: { keywords: string[]; reply: string }[] = [
  { keywords: ["친구", "우정", "다퉜"], reply: "친구 관계 때문에 속상했겠어요. 어떤 일이 있었는지 조금 더 말해줄래요?" },
  { keywords: ["시험", "성적", "공부"], reply: "시험 스트레스는 정말 힘들죠. 잠깐 쉬어가는 것도 좋은 방법이에요. 어떤 과목이 제일 걱정돼요?" },
  { keywords: ["힘들", "지치", "스트레스"], reply: "많이 지쳤겠어요. 그런 감정을 느끼는 건 자연스러운 일이에요. 오늘 하루 중 힘들었던 순간을 이야기해 줄래요?" },
  { keywords: ["고마워", "감사"], reply: "천만에요! 언제든 다시 이야기하러 와도 좋아요. 😊" },
  { keywords: ["안녕"], reply: "안녕하세요! 오늘 마음은 좀 어때요?" },
];

const FALLBACK = "이야기해줘서 고마워요. 조금 더 자세히 들려줄 수 있어요?";

function getReply(input: string): string {
  const rule = RULES.find((r) => r.keywords.some((k) => input.includes(k)));
  return rule?.reply ?? FALLBACK;
}

export default function MaeumiChatbotDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "안녕하세요, 저는 마음이예요. 편하게 고민을 이야기해 주세요. 🌱" },
  ]);
  const [input, setInput] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const reply = getReply(text);
    setMessages((prev) => [...prev, { from: "user", text }, { from: "bot", text: reply }]);
    setInput("");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200">
        🎓 학생 예시 프로젝트 — 정해진 규칙으로 답하는 간단한 챗봇 데모예요. 실제 AI나 전문 상담이
        아니며, 힘든 일이 있다면 꼭 선생님이나 상담 선생님께 이야기해 주세요.
      </div>

      <h1 className="text-2xl font-bold">🤖 고민상담 챗봇 &apos;마음이&apos;</h1>

      <div className="flex h-96 flex-col gap-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              m.from === "bot"
                ? "self-start bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"
                : "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          메시지 입력
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="고민을 입력해 보세요..."
          className="h-12 flex-1 rounded-xl border border-zinc-300 px-4 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="h-12 rounded-xl bg-violet-600 px-5 text-base font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-700"
        >
          전송
        </button>
      </form>
    </div>
  );
}
