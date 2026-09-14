"use client";

import { useState } from "react";
import type { MaeumiChatbotContent } from "./content";

type Message = { from: "user" | "bot"; text: string };

export function MaeumiChatbotDemo({ content }: { content: MaeumiChatbotContent }) {
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: content.greeting }]);
  const [input, setInput] = useState("");

  function getReply(text: string): string {
    const lower = text.toLowerCase();
    const rule = content.rules.find((r) => r.keywords.some((k) => lower.includes(k.toLowerCase())));
    return rule?.reply ?? content.fallback;
  }

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
        {content.badge}
      </div>

      <h1 className="text-2xl font-bold">{content.title}</h1>

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
          {content.inputLabel}
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={content.inputPlaceholder}
          className="h-12 flex-1 rounded-xl border border-zinc-300 px-4 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="h-12 rounded-xl bg-violet-600 px-5 text-base font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-700"
        >
          {content.sendButton}
        </button>
      </form>
    </div>
  );
}
