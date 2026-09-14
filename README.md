# KIS 디지털 프로젝트 전시관

학생들이 vibe coding으로 만든 웹사이트, 게임, 앱, AI 챗봇, 인터랙티브 프로젝트를 학교 전시
공간에서 소개하고, 방문자가 검색·필터링하며 QR 코드나 링크로 직접 체험할 수 있는 MVP
플랫폼입니다.

## 스택

Next.js (App Router) + TypeScript + Tailwind CSS — zod로 폼 검증, `qrcode`로 QR 코드 생성,
[thum.io](https://www.thum.io/)(키 없이 쓰는 무료 스크린샷 서비스)로 대표 이미지 자동 생성.
별도 데이터베이스 없이 저장소를 사용하는 MVP 구성이며, 실행 환경에 따라 두 백엔드 중
하나를 자동으로 선택합니다(`lib/store.ts`):

- **로컬 개발** (`npm run dev`): 서버 전용 JSON 파일(`data/projects.json`, 첫 실행 시
  `lib/sampleData.ts`로 자동 시딩)
- **Netlify 배포**: [Netlify Blobs](https://docs.netlify.com/blobs/overview/) — Netlify
  Functions에는 여러 요청 간에 공유되는 쓰기 가능한 파일 시스템이 없으므로, 배포 환경에서는
  제출/상태 변경이 실제로 저장되도록 이 백엔드를 사용합니다. Netlify Functions 런타임에서만
  존재하는 `process.env.NETLIFY_BLOBS_CONTEXT`로 자동 판별하며(`lib/runtime.ts`) 별도
  설정이 필요 없습니다.

```
app/
  (gallery)/         # 방문자 갤러리(검색/필터), URL은 "/"
  projects/[id]/      # 프로젝트 상세 (실행 링크 + QR 코드)
  submit/              # 프로젝트 제출 폼 (Server Action)
  manage/              # 전시 상태 관리 화면 (Server Action, 교사 로그인 필요)
  manage/login/        # 교사 로그인 폼 (Server Action)
  files/[id]/[[...path]]/ # 업로드된 HTML/ZIP 파일을 실행 링크로 그대로 서빙하는 라우트
  gone/                # 비공개/미존재 프로젝트에 대한 진짜 404 응답용 내부 라우트
lib/
  types.ts, schema.ts, formAction.ts, validation.ts, thumbnail.ts, origin.ts,
  filters.ts, store.ts, sampleData.ts, runtime.ts, auth.ts, loginThrottle.ts,
  uploadedSite.ts
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

## 실행 링크: URL 또는 파일 업로드

제출/수정 폼의 "실행 방법"에서 둘 중 하나를 고를 수 있습니다.

- **🔗 링크 입력**: Replit, Netlify, Vercel 등에 이미 배포된 프로젝트의 주소를 입력합니다.
- **📁 파일 업로드**: 완성된 프로젝트를 이 앱이 직접 호스팅합니다(최대 4MB).
  - HTML 파일 하나(.html)로 끝나는 프로젝트라면 그 파일만 올리면 되고,
    `/files/{프로젝트 id}`로 그대로 서빙됩니다.
  - 이미지 등 다른 파일도 함께 쓴다면 **폴더 전체를 압축한 ZIP 파일**을 올려야 합니다.
    HTML 파일 하나만 업로드하면 그 안에서 `<img src="images/4.png">`처럼 상대경로로
    참조하는 이미지는 학생의 컴퓨터에만 있는 로컬 경로이므로 전시관에서는 절대 보이지
    않습니다 — 이 문제로 실제로 학생이 만든 웹사이트 사진이 안 보이는 사고가 있었습니다.
    ZIP을 올리면 안의 모든 파일을 원래 폴더 구조 그대로 저장하고
    `/files/{프로젝트 id}/{zip 안의 경로}`로 서빙하므로(`lib/uploadedSite.ts`의
    `extractZipSite`), 상대경로 참조가 그대로 맞아떨어집니다. `index.html`을
    최우선으로, 없으면 가장 얕은 위치의 `.html` 파일을 실행 페이지로 선택합니다.
  - 포스터나 카드뉴스처럼 결과물이 **이미지 한 장(.png/.jpg/.gif/.webp), 짧은
    영상(.mp4/.webm/.mov) 한 편, 또는 PDF 한 장**이라면 그 파일을 바로 올릴 수
    있습니다. HTML/ZIP과 마찬가지로 `/files/{프로젝트 id}`로 서빙되며, 이미지인
    경우 대표 이미지를 비워두면 thum.io 스크린샷 대신 업로드한 이미지 자체를
    그대로 대표 이미지로 씁니다. 보안상 `.svg`는 이 경로로는 받지 않습니다 —
    HTML처럼 `<script>`를 담을 수 있는 형식이라 ZIP 안에 넣어 올리는 경우와 달리
    "이미지 첨부"처럼 보이는 입력창 뒤에 그 위험을 숨기고 싶지 않기 때문입니다.
    영상은 4MB 한도 안에서만 의미가 있습니다 — 대부분의 진짜 영상은 이보다
    훨씬 크므로, 긴 영상은 유튜브 등에 올리고 그 주소를 실행 링크(URL 모드)로
    제출해야 합니다.
  - (`app/files/[id]/[[...path]]/route.ts`, `lib/formAction.ts`의 `resolveLaunchFields`.)

**4MB 이상으로 올리지 마세요 — 앱 설정이 아니라 Netlify 자체의 한계입니다.**
Server Action 요청 본문은 Next.js 기본값이 1MB라 `next.config.ts`의
`serverActions.bodySizeLimit`을 올려야 하지만, 그와 별개로 Netlify의 함수/CDN
계층이 raw 요청 본문을 약 4.5MB에서 하드하게 잘라버립니다(base64 인코딩 시
6MB로 맞아떨어지는, AWS Lambda/API Gateway 동기 호출의 전형적인 한계) — 이
값은 next.config.ts를 아무리 올려도 바뀌지 않으며, 우리 코드가 실행되기도 전에
413으로 거부됩니다. 실제로 배포된 사이트에 4.45MB는 성공, 4.5MB는 413으로
직접 확인했습니다. 이 이상 진짜로 올리려면 Server Action을 거치지 않고 브라우저가
스토리지에 직접 업로드하는 방식(서명된 업로드 URL 등)으로 아키텍처를 바꿔야
합니다 — `MAX_UPLOAD_BYTES`(`lib/formAction.ts`)와 `bodySizeLimit`
(`next.config.ts`)에 이 내용이 자세히 적혀 있습니다.

어느 쪽을 선택하든 대표 이미지를 비워두면 실행 링크를 thum.io로 캡처한 스크린샷을
자동으로 대표 이미지로 등록합니다(`lib/thumbnail.ts`). thum.io는 처음 요청한 주소에는
스크린샷이 준비되는 동안 임시 이미지를 먼저 보여주므로, 막 제출한 프로젝트의 썸네일이
잠시 일반적인 모습으로 보일 수 있습니다. 로컬 개발 환경(`http://localhost:...`)에 올린
파일은 thum.io가 접근할 수 없어 썸네일이 실패하는데, 이 경우 카드가 자동으로 카테고리
아이콘으로 대체됩니다(`components/CoverImage.tsx`).

**업로드 파일의 신뢰 경계**: 업로드된 HTML/ZIP 안 콘텐츠는 별도 검증이나 sandbox
없이 그대로 서빙됩니다. 안전성은 이 라우트 자체가 아니라, 이미 존재하는 "심사 대기중
→ 전시중" 검토 절차에 달려 있습니다 — 즉 교사가 검토해 '전시중'으로 바꾸기 전까지는
방문자 갤러리에 노출되지 않는다는 점이 유일한 방어선입니다. 이미지(PNG/JPG/GIF/WebP),
영상(MP4/WebM/MOV), PDF는 `<script>`를 담을 수 없는 정적 형식이라 이 위험이
없지만, SVG는 예외라서 "이미지 업로드"로는 받지 않습니다(위 참고) — 그래도 모든
업로드는 동일하게 이 검토 절차를 거쳐야 전시됩니다.

## 교사 로그인

`/manage`(전시 상태 관리)와 `/manage/[id]/edit`은 `/manage/login`에서 로그인한 교사만 볼 수
있습니다(`lib/auth.ts`). 학교 하나에 교사 계정 하나만 있는 간단한 구성이지만, 다음은 실제
보안 조치입니다 — 링크만 숨기는 UI 차원의 가림막이 아닙니다.

- **비밀번호는 평문으로 저장되지 않습니다.** 환경 변수에는 무작위 salt를 더한 scrypt
  해시(`TEACHER_PASSWORD_SALT`, `TEACHER_PASSWORD_HASH`)만 저장하며, 원본 비밀번호는
  git 저장소나 로그 어디에도 남지 않습니다. 로컬 개발용 값은 `.env`(gitignore 처리됨)에,
  배포용 값은 Netlify 환경 변수에 별도로 설정합니다. 새 계정을 만들려면 `.env.example`의
  안내를 따르세요.
- **세션은 서명된 만료 토큰입니다.** 단순한 `loggedIn=true` 쿠키가 아니라
  `<만료시각>.<HMAC-SHA256 서명>` 형태의 토큰을 httpOnly 쿠키로 저장합니다
  (`SESSION_SECRET`으로 서명). 이 값을 모르면 유효한 세션을 위조할 수 없고, 훔친 쿠키도
  8시간 후에는 만료됩니다.
- **로그인 시도 제한은 IP 기준입니다.** 같은 IP에서 15분 내 5회 로그인 실패 시 잠시
  차단됩니다(`lib/loginThrottle.ts`). 쿠키가 아니라 IP를 기준으로 세므로 쿠키를 지우거나
  시크릿 창을 열어도 우회되지 않습니다. `lib/store.ts`와 동일하게 배포 환경에서는 Netlify
  Blobs, 로컬에서는 메모리를 사용합니다.
- **실제 방어선은 페이지/Server Action 안입니다.** `proxy.ts`도 로그인 여부를 확인하지만,
  이 저장소는 Windows에서 Netlify Edge Function 번들링 버그를 피하기 위해
  `scripts/netlify-build.mjs`가 실제 빌드 직전에 `proxy.ts`를 항상 제거했다가 복원합니다 —
  즉 배포된 사이트에서는 `proxy.ts`가 전혀 실행되지 않습니다. 그래서 진짜 접근 제어는
  `app/manage/(list)/page.tsx`, `app/manage/[id]/edit/page.tsx`, `app/manage/actions.ts`의
  각 Server Action 안에서 `hasValidTeacherSession()` / `requireTeacherSession()`으로
  이중 확인합니다; `proxy.ts` 쪽 확인은 로컬 개발에서만 동작하는 보너스입니다.

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

- **교사 계정이 하나뿐입니다**: 위 "교사 로그인"에서 설명한 대로 로그인 보호 자체는
  적용되어 있지만, 교사별 계정/역할 구분은 없는 단일 공유 계정 방식입니다. 여러 교사가
  각자의 계정으로 구분되어 활동 기록을 남겨야 하는 규모라면 실제 다중 사용자 인증
  시스템으로 교체가 필요합니다.
- **정식 데이터베이스 아님**: 로컬은 JSON 파일, 배포 환경은 Netlify Blobs를 쓰지만 둘 다
  스키마 마이그레이션이 없고, 동시 쓰기는 마지막에 쓴 내용이 이전 내용을 덮어씁니다(원자적
  갱신이 아님). 학교 전시 부스 수준의 트래픽에는 충분하지만, 다수 교사가 동시에 편집하거나
  트래픽이 커지면 실제 데이터베이스 도입이 필요합니다.
- **콘텐츠 검수 없음**: 제출된 URL이나 이미지 URL의 안전성은 스킴(http/https)만
  검증하며, 실제 콘텐츠를 사전 검사하지 않습니다. 업로드된 파일(HTML, ZIP, 이미지,
  영상, PDF)도 마찬가지로 sandbox 없이 그대로 서빙되며, 안전성은 교사의 심사 절차에 의존합니다(위 "실행 링크"
  참고). 실제 운영 전에는 업로드 파일에 대한 `<iframe sandbox>` 격리나 별도 서브도메인
  분리를 고려해야 합니다.
- **외부 스크린샷 서비스 의존**: 대표 이미지 자동 생성은 thum.io(무료, 키 없음)에
  의존합니다. 이 서비스가 느려지거나 중단되면 자동 썸네일이 나타나지 않을 수 있지만,
  이 경우 카테고리 아이콘으로 안전하게 대체되므로 기능 자체가 멈추지는 않습니다.
