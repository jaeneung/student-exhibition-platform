import type { Locale } from "@/lib/i18n";

interface Rule {
  keywords: string[];
  reply: string;
}

export interface MaeumiChatbotContent {
  badge: string;
  title: string;
  greeting: string;
  inputLabel: string;
  inputPlaceholder: string;
  sendButton: string;
  rules: Rule[];
  fallback: string;
}

const ko: MaeumiChatbotContent = {
  badge:
    "🎓 학생 예시 프로젝트 — 정해진 규칙으로 답하는 간단한 챗봇 데모예요. 실제 AI나 전문 상담이 아니며, 힘든 일이 있다면 꼭 선생님이나 상담 선생님께 이야기해 주세요.",
  title: "🤖 고민상담 챗봇 '마음이'",
  greeting: "안녕하세요, 저는 마음이예요. 편하게 고민을 이야기해 주세요. 🌱",
  inputLabel: "메시지 입력",
  inputPlaceholder: "고민을 입력해 보세요...",
  sendButton: "전송",
  rules: [
    { keywords: ["친구", "우정", "다퉜"], reply: "친구 관계 때문에 속상했겠어요. 어떤 일이 있었는지 조금 더 말해줄래요?" },
    { keywords: ["시험", "성적", "공부"], reply: "시험 스트레스는 정말 힘들죠. 잠깐 쉬어가는 것도 좋은 방법이에요. 어떤 과목이 제일 걱정돼요?" },
    { keywords: ["힘들", "지치", "스트레스"], reply: "많이 지쳤겠어요. 그런 감정을 느끼는 건 자연스러운 일이에요. 오늘 하루 중 힘들었던 순간을 이야기해 줄래요?" },
    { keywords: ["고마워", "감사"], reply: "천만에요! 언제든 다시 이야기하러 와도 좋아요. 😊" },
    { keywords: ["안녕"], reply: "안녕하세요! 오늘 마음은 좀 어때요?" },
  ],
  fallback: "이야기해줘서 고마워요. 조금 더 자세히 들려줄 수 있어요?",
};

const en: MaeumiChatbotContent = {
  badge:
    "🎓 Student example project — a simple rule-based chatbot demo. This isn't real AI or professional counseling — if something is really bothering you, please talk to a teacher or counselor.",
  title: "🤖 Maeumi, the Peer-Support Chatbot",
  greeting: "Hi, I'm Maeumi. Feel free to share what's on your mind. 🌱",
  inputLabel: "Message input",
  inputPlaceholder: "Type what's on your mind...",
  sendButton: "Send",
  rules: [
    { keywords: ["friend", "fight"], reply: "That sounds like it hurt. Can you tell me a bit more about what happened?" },
    { keywords: ["test", "exam", "grade", "study"], reply: "Exam stress is really tough. Taking a short break can help too. Which subject worries you the most?" },
    { keywords: ["tired", "exhausted", "stress"], reply: "That sounds exhausting. It's completely natural to feel that way. Want to tell me about the hardest part of your day?" },
    { keywords: ["thank"], reply: "You're welcome! Feel free to come back and chat anytime. 😊" },
    { keywords: ["hi", "hello"], reply: "Hello! How are you feeling today?" },
  ],
  fallback: "Thanks for sharing that. Can you tell me a little more?",
};

export function getMaeumiChatbotContent(locale: Locale): MaeumiChatbotContent {
  return locale === "en" ? en : ko;
}
