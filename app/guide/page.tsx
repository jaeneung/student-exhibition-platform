import Link from "next/link";

function StepCard({
  number,
  icon,
  title,
  children,
}: {
  number: number;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
        {number}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function ToolGuide({
  name,
  emoji,
  steps,
}: {
  name: string;
  emoji: string;
  steps: string[];
}) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-zinc-50 open:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:open:bg-zinc-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{emoji}</span>
          {name}
        </span>
        <span aria-hidden="true" className="text-zinc-400 transition group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <ol className="flex flex-col gap-1.5 px-4 pb-4 text-sm text-zinc-700 dark:text-zinc-300">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold text-brand-600">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          📖
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">프로젝트 제출 가이드</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          내가 만든 웹사이트, 게임, 앱, AI 챗봇을 전시관에 올리는 방법을 순서대로 알려드릴게요.
          처음이어도 5분이면 충분해요.
        </p>
      </div>

      <StepCard number={1} icon="✅" title="프로젝트를 완성하고 링크 받기">
        <p>
          가장 중요한 건 <strong>&apos;직접 눌러볼 수 있는 인터넷 주소(링크)&apos;</strong>가
          있어야 한다는 거예요. 내 컴퓨터에만 있는 파일이나, 로그인해야만 볼 수 있는 화면은
          안 돼요 — 방문자가 아무 기기에서나 바로 열어볼 수 있어야 해요.
        </p>
        <p className="font-medium">
          AI/바이브 코딩 도구로 만들었다면, 아래에서 내가 쓴 도구를 눌러 링크 받는 방법을
          확인하세요.
        </p>

        <div className="mt-1 flex flex-col gap-2">
          <ToolGuide
            name="Replit"
            emoji="🟢"
            steps={[
              "화면 위쪽의 'Run' 버튼을 눌러 프로젝트를 실행해요.",
              "오른쪽에 나타나는 미리보기 화면 위쪽 주소창의 링크를 복사해요.",
              "더 안정적인 링크를 원하면 'Deploy' 버튼을 눌러 배포한 뒤 그 주소를 사용해요.",
            ]}
          />
          <ToolGuide
            name="v0.dev (Vercel)"
            emoji="▲"
            steps={[
              "화면 오른쪽 위 'Publish' 또는 'Deploy' 버튼을 눌러요.",
              "배포가 끝나면 생성되는 https://...vercel.app 주소를 복사해요.",
            ]}
          />
          <ToolGuide
            name="bolt.new"
            emoji="⚡"
            steps={[
              "화면 오른쪽 위 'Deploy' 버튼을 눌러요.",
              "Netlify 등으로 배포를 진행하고, 완료되면 나오는 주소를 복사해요.",
            ]}
          />
          <ToolGuide
            name="lovable.dev"
            emoji="💗"
            steps={[
              "화면 오른쪽 위 'Publish' 또는 'Share' 버튼을 눌러요.",
              "공개된 프로젝트 주소(URL)를 복사해요.",
            ]}
          />
          <ToolGuide
            name="Glitch"
            emoji="🎏"
            steps={[
              "화면 왼쪽 위 'Share' 버튼을 눌러요.",
              "'Live Site' 항목에 있는 주소를 복사해요.",
            ]}
          />
          <ToolGuide
            name="Netlify / Vercel에 직접 올리기"
            emoji="☁️"
            steps={[
              "netlify.com 또는 vercel.com에서 무료 계정을 만들어요.",
              "내 프로젝트 폴더를 화면에 드래그하거나, GitHub 저장소를 연결해서 배포해요.",
              "배포가 끝나면 생성되는 주소(예: my-project.netlify.app)를 복사해요.",
            ]}
          />
        </div>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          💡 링크는 반드시 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">http://</code>{" "}
          또는 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">https://</code>로
          시작해야 제출할 수 있어요.
        </p>
      </StepCard>

      <StepCard number={2} icon="📝" title="제출 정보 미리 준비하기">
        <p>제출 화면에서 아래 내용을 물어봐요. 미리 생각해두면 더 빨리 끝나요.</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>프로젝트 제목</strong> — 어떤 프로젝트인지 한눈에 알 수 있는 이름
          </li>
          <li>
            <strong>제작자 / 팀 이름</strong> — 실명이 아닌 팀 이름이나 별명 (아래 주의사항 참고)
          </li>
          <li>
            <strong>카테고리</strong> — 웹사이트 / 게임 / 앱 / AI 챗봇 / 인터랙티브 / 기타 중 선택
          </li>
          <li>
            <strong>한 줄 소개 &amp; 상세 설명</strong> — 무엇을 하는 프로젝트인지 짧게, 자세히
          </li>
          <li>
            <strong>실행 링크</strong> — 1단계에서 준비한 그 주소
          </li>
        </ul>
        <p>
          태그, 대표 이미지, 사용한 기술, 만들게 된 계기 같은 항목은 선택 사항이에요. 여유가
          있으면 채워보되, 없어도 제출하는 데는 문제없어요.
        </p>
      </StepCard>

      <StepCard number={3} icon="🔒" title="개인정보 &amp; 안전 주의사항">
        <ul className="list-disc pl-5">
          <li>
            <strong>실명, 학번, 전화번호, 이메일은 절대 적지 마세요.</strong> 팀 이름이나 별명만
            사용해요. (예: &apos;환경지킴이 동아리&apos;, &apos;컴퓨터 동아리 3인방&apos;)
          </li>
          <li>
            친구나 다른 사람의 얼굴 사진, 개인정보가 담긴 화면은 캡처/업로드하지 마세요.
          </li>
          <li>
            소리가 크게 나거나 화면이 갑자기 번쩍이는 효과가 있다면 &apos;안전 및 이용 안내&apos;
            항목에 미리 알려주세요. (예: &apos;효과음이 재생돼요&apos;)
          </li>
          <li>저작권이 있는 이미지·음악을 사용했다면 출처를 함께 남겨주면 좋아요.</li>
        </ul>
      </StepCard>

      <StepCard number={4} icon="🚀" title="제출하고 결과 기다리기">
        <p>
          준비가 끝났다면{" "}
          <Link href="/submit" className="font-semibold text-brand-700 underline dark:text-brand-400">
            프로젝트 제출하기
          </Link>{" "}
          페이지에서 내용을 입력하고 제출 버튼을 눌러요.
        </p>
        <p>
          제출한 프로젝트는 바로 전시되지 않아요. <strong>&apos;심사 대기중&apos;</strong> 상태로
          등록되고, 선생님이 확인한 뒤 <strong>&apos;전시중&apos;</strong>으로 바꾸면 방문자
          갤러리에 나타나요. 수정하고 싶은 내용이 있다면 선생님께 말씀드려 주세요.
        </p>
      </StepCard>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-6 text-center dark:border-brand-800 dark:bg-brand-950">
        <p className="text-sm font-medium text-brand-900 dark:text-brand-200">
          준비가 다 됐나요? 이제 제출하러 가볼까요?
        </p>
        <Link
          href="/submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-sm font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          프로젝트 제출하러 가기 →
        </Link>
      </div>
    </div>
  );
}
