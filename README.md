# KIS 디지털 프로젝트 전시관

학생들이 vibe coding으로 만든 웹사이트, 게임, 앱, AI 챗봇, 인터랙티브 프로젝트를 학교 전시
공간에서 소개하고, 방문자가 검색·필터링하며 QR 코드나 링크로 직접 체험할 수 있는 MVP
플랫폼입니다.

## 스택

Next.js (App Router) + TypeScript + Tailwind CSS — zod로 폼 검증, `qrcode`로 QR 코드 생성.
별도 데이터베이스 없이 저장소를 사용하는 MVP 구성이며, 실행 환경에 따라 두 백엔드 중
하나를 자동으로 선택합니다(`lib/store.ts`):

- **로컬 개발** (`npm run dev`): 서버 전용 JSON 파일(`data/projects.json`, 첫 실행 시
  `lib/sampleData.ts`로 자동 시딩)
- **Netlify 배포**: [Netlify Blobs](https://docs.netlify.com/blobs/overview/) — Netlify
  Functions에는 여러 요청 간에 공유되는 쓰기 가능한 파일 시스템이 없으므로, 배포 환경에서는
  제출/상태 변경이 실제로 저장되도록 이 백엔드를 사용합니다. `process.env.NETLIFY`가
  `"true"`인지로 자동 판별하며 별도 설정이 필요 없습니다.

```
app/
  (gallery)/         # 방문자 갤러리(검색/필터), URL은 "/"
  projects/[id]/      # 프로젝트 상세 (실행 링크 + QR 코드)
  submit/              # 프로젝트 제출 폼 (Server Action)
  manage/              # 전시 상태 관리 화면 (Server Action)
  gone/                # 비공개/미존재 프로젝트에 대한 진짜 404 응답용 내부 라우트
lib/
  types.ts, schema.ts, validation.ts, filters.ts, store.ts, sampleData.ts
components/            # ProjectCard, SearchFilterBar, LaunchButton, QrCode 등
proxy.ts               # 상세/수정 라우트 접근 전 존재 여부를 먼저 확인해 진짜 404를 반환
tests/                 # vitest 단위 테스트
```

## 실행 방법

```bash
npm install
npm run dev
```

<http://localhost:3000> 에서 확인합니다. 첫 요청 시 `data/projects.json`이 없으면
`lib/sampleData.ts`의 샘플 프로젝트로 자동 생성됩니다(전시중 5개 + 심사 대기 1개 + 비공개
1개 — 상태별 노출 규칙을 바로 확인할 수 있도록 구성).

## 검증 명령

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 전시 상태와 공개 범위

프로젝트는 `심사 대기중(pending_review)` → `전시중(on_display)` → `비공개(private)` 상태를
가집니다. 일반 방문자는 **전시중** 상태의 프로젝트만 볼 수 있으며, 이 규칙은 UI가 아니라
`lib/store.ts`/`lib/filters.ts`(서버 쪽 데이터 조회 함수)에서 강제됩니다 — 즉 화면에서
숨기는 것이 아니라 애초에 서버가 해당 데이터를 내려주지 않습니다. `/projects/[id]`와
`/manage/[id]/edit`은 대상이 없거나 볼 수 없는 경우 `proxy.ts`가 렌더링 전에 먼저 확인해
실제 HTTP 404를 반환합니다(비동기 데이터 조회 후 `notFound()`를 호출하면 스트리밍이 이미
시작되어 상태 코드를 200으로 되돌릴 수 없는 Next.js App Router의 제약 때문입니다).

## 배포 (Netlify + GitHub)

이 저장소는 GitHub에 연결된 Netlify 사이트로 배포되어 있습니다. `main` 브랜치에 push하면
Netlify가 자동으로 다시 빌드/배포합니다 (`netlify.toml`에 빌드 명령과
`@netlify/plugin-nextjs` 플러그인이 설정되어 있습니다).

직접 새로 배포하려면:

```bash
npm install -g netlify-cli   # 이미 있다면 생략
netlify login
netlify init                 # 현재 폴더를 새 Netlify 사이트와 연결
```

## 알려진 한계 (실제 학교 배포 전 필요 작업)

- **인증 없음**: `/manage` 관리 화면은 로그인으로 보호되지 않습니다. 주소를 아는 누구나
  모든 프로젝트를 열람하고 상태를 바꿀 수 있습니다. 실제 배포 전 교사 로그인 등 접근
  제어가 반드시 필요합니다.
- **정식 데이터베이스 아님**: 로컬은 JSON 파일, 배포 환경은 Netlify Blobs를 쓰지만 둘 다
  스키마 마이그레이션이 없고, 동시 쓰기는 마지막에 쓴 내용이 이전 내용을 덮어씁니다(원자적
  갱신이 아님). 학교 전시 부스 수준의 트래픽에는 충분하지만, 다수 교사가 동시에 편집하거나
  트래픽이 커지면 실제 데이터베이스 도입이 필요합니다.
- **콘텐츠 검수 없음**: 제출된 URL이나 이미지 URL의 안전성은 스킴(http/https)만
  검증하며, 실제 콘텐츠를 사전 검사하지 않습니다.
