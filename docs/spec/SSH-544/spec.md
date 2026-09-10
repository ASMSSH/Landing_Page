# SSH-544 — Supabase `claims` 테이블 + `POST /api/claims` (접수번호·insert·슬랙·환경변수)

`/apply` 웹 창구의 S1~S6 화면은 전부 `dev`에 있다(SSH-542·543·473·486). S5 「신청하기」는 `POST /api/claims`를 실제로 부르지만
**서버가 없어 404 → 실패 배너**가 뜬다. 이 PR이 그 서버를 만든다 — 입력 검증 → 접수번호 `BGN-YYMMDD-NN` → service role 키로
Supabase `claims`에 행 1개 → 슬랙 Incoming Webhook 1통 → `{ ok: true, receipt_no }`. 저장소는 노션 DB가 아니라 **기존 랜딩
트래킹 Supabase 프로젝트**의 `claims` 단일 테이블이다(9/9 결정). 개인정보가 들어가므로 RLS를 켜고 anon 정책을 두지 않는다 —
브라우저는 절대 직접 쓰지 못하고 서버리스만 쓴다. 함께 SSH-486 리뷰에서 넘어온 **멱등 키 `client_id`**를 넣어 「다시 시도」가
중복 접수를 만들지 못하게 한다.

> **이 PR이 남기는 것 한 문장**: 프리뷰 `/apply`에서 신청 1건을 보내면 Supabase `claims`에 행 1개가 생기고 응답의 접수번호가
> S6에 보이며, 같은 날 2번째 신청은 `-02`, 같은 신청을 다시 보내면 새 행 없이 같은 접수번호가 돌아온다. (슬랙은 webhook이
> 생기면 1통 — 아래 「검증」)

## 배경

참고한 문서 — 리뷰어가 "이 결정의 근거가 어디냐"를 묻지 않게 여기 적는다.

- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ⑤ 데이터(컬럼 목록·RLS·접수번호·운영 보드·환경변수·
  「전화번호는 `events`에만 안 넣는다」의 재서술), ⑦ 기술(`server/supabase.ts` 신설·`analytics.ts`의 PostgREST 호출 방식 재사용),
  ⑧ 저장소 결정(노션 DB → Supabase 단일 테이블, 9/9)·파생 리스크(무료 티어 백업 없음·7일 미접속 일시정지), ⑫ 담당 배분
  (슬랙 채널·테이블 생성은 성식)
- **위키 raw** `raw/기획/2026-09-08-MVP-웹-v1.0.0-설계.md` §6-2(저장과 알림 — 슬랙 문안에 이름·전화번호 금지, 슬랙 실패해도
  저장은 살린다, 자동 재시도 없음)·§8(환경변수 이름)
- **Jira** SSH-544 본문 + 코멘트(2026-09-10, SSH-486 AI 리뷰 P3에서 넘어온 멱등 키 제안) · 형제 SSH-486(클라이언트 계약 —
  PR #32 본문 「payload는 claims 컬럼 이름 그대로」) · SSH-474(슬랙 알림, 성식) · SSH-545(트래킹·배포 판정·`server/notion.ts` 삭제)
- **계획 단계 사용자 결정**(2026-09-10): ① `client_id` 멱등 키를 이 티켓에 넣는다 ② 준비물은 Supabase 키만 있고 슬랙 webhook은
  아직 없다 → insert까지 실제 검증, 슬랙은 테스트로만

### 왜 `count + 1`이 아니라 「당일 마지막 NN + 1」인가

티켓은 「당일(KST) 행 수 + 1」이다. 행 수로 만들면 운영자가 Table Editor에서 테스트 행을 지운 뒤 그날 다음 신청이 이미 쓴 번호와
충돌한다(unique 제약 → 재시도 1회 → 또 충돌하면 실패). `receipt_no=like.BGN-260910-*`로 당일 **마지막 번호**를 읽어 +1 하면
행이 지워져도 번호는 앞으로만 간다. 결과는 같고(정상 상황에서 행 수 + 1 = 마지막 NN + 1) 조회 비용도 같다(인덱스 없이도
하루 수십 건). unique 제약 + 충돌 시 1회 재시도는 티켓 그대로 둔다 — 동시 신청 2건이 같은 번호를 읽는 경합은 이걸로 막는다.

### 왜 멱등 키가 필요한가 · 어디에 두나

클라이언트(`src/lib/claims.ts`)는 15초 타임아웃 뒤 실패 배너 + 「다시 시도」를 보여 주는데, 서버가 insert는 끝내고 응답만 늦은
경우와 구분이 안 된다. 그대로면 「다시 시도」가 같은 본문으로 새 행을 만든다(중복 접수 + 슬랙 2통). 그래서 브라우저가
`crypto.randomUUID()`로 `client_id`를 만들어 보내고, 서버는 `claims.client_id unique`로 두어 같은 값이 다시 오면 insert 대신
**기존 `receipt_no`를 200으로** 돌려준다.

`client_id`는 `ApplyProvider`(`ApplyContext.tsx`)에 둔다. `state.ts`의 `initialApplyState`는 상수 객체라 여기 넣으면 `reset` 뒤에도
같은 값이 남는다 — 접수 완료 → 「처음으로」 → 새 신청이 **이전 접수번호를 돌려받는** 사고다. Provider는 이미 `submitting`을
들고 있고(SSH-486 P2) `dispatch`를 감싸 `reset`을 가로채고 있으므로 거기서 UUID를 새로 만든다. 실패 → S4로 갔다가 S5로
돌아와 다시 눌러도 Provider가 살아 있어 같은 값이 간다.

### 왜 서버 검증을 `src/apply/validate*.ts`에서 import하지 않나

`server/`는 지금까지 `src/`를 import한 적이 없다(`api/tsconfig.json`의 include도 `../server/**`뿐). Vercel이 `api/*.ts`를 따로
번들하므로 `src/` 파일이 딸려 들어가면 `.ts` 확장자 import·React 타입 등 다른 컴파일 조건을 끌고 온다. 인증 없는 공개 API라
서버도 같은 수준으로 막아야 하니 **규칙을 복제**한다(2절 표). 두 곳이 어긋나면 클라이언트가 통과시킨 값을 서버가 400으로
돌려보내 실패 배너가 뜨는 것이 최악이고, 그건 테스트가 잡는다(클라이언트 테스트의 통과 케이스를 서버 테스트에도 넣는다).

### 지금 레포 상태 — 딛고 설 것

- `api/subscribe.ts` + `server/notion.ts` — 서버리스는 파싱·응답 변환만, 로직은 `server/`의 순수 함수가 `{ status, body }`를 돌려준다.
  import는 `.js` 확장자(nodenext). `api/claims.ts`도 이 모양
- `server/gemini.test.ts` — `globalThis.fetch`를 바꿔치기해 외부 호출을 스텁하는 테스트 패턴. `server/claims.test.ts`가 따른다
- `vite.config.ts` — `subscribeApi(env)` 플러그인(POST 본문을 모아 JSON → `server/` 함수 → `send`). `/api/claims`도 같은 플러그인 하나
- `src/lib/analytics.ts` — Supabase를 SDK 없이 fetch(`apikey` + `Authorization: Bearer`)로 부른다. 서버도 SDK 없이 같은 방식,
  키만 service role
- `supabase/schema.sql` — `events` DDL + RLS + anon insert 정책. `claims`는 그 아래 append
- `src/apply/claimPayload.ts` `ClaimPayload`(키 = `claims` 컬럼 snake_case) · `src/lib/claims.ts`(응답 계약) · `ApplyContext.tsx`
  (`submitting`) · `steps/StepConsent.tsx#submit`
- `.env.example`에 `GEMINI_API_KEY`·`GEMINI_MODEL`이 빠져 있다(SSH-543 때 미룸) — 티켓이 이 PR에서 보정하라고 한다
- Node 26(`.nvmrc`) — `AbortSignal.timeout`·`crypto.randomUUID`·`fetch` 전부 내장. 의존성 추가 없음

## 범위

### 1. 스키마 — `Project/supabase/schema.sql`에 `public.claims` append

```sql
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  receipt_no text not null unique,               -- BGN-YYMMDD-NN (서버가 만든다)
  client_id uuid unique,                          -- 멱등 키 (브라우저가 만들고 재시도 때 같은 값)
  guardian_name text not null,
  guardian_phone text not null,                   -- 010-XXXX-XXXX
  guardian_birth date not null,
  pet_name text not null,
  hospital_name text not null,
  hospital_address text,
  visit_date date not null,
  treatment_cost integer not null check (treatment_cost >= 0),
  diagnosis text,
  insurer text not null,
  product_name text,
  required_docs jsonb,                            -- S3 스냅샷 { insurer, claimType, hospitalIssued[], selfPrepared[], fallback }
  consent_terms boolean not null,
  consent_privacy boolean not null,
  consent_unique_id boolean not null,
  consent_hospital_3p boolean not null,
  consent_insurer_3p boolean not null,
  consented_at timestamptz not null default now(),  -- 서버(DB) 시각. 클라이언트는 보내지 않는다
  consent_version text not null,                  -- consent-v1
  ref_code text,                                  -- ?r= 유입 코드
  status text not null default '신규' check (status in ('신규', '확인중', '서류확보', '청구완료')),
  assignee text,
  memo text,
  slack_notified boolean not null default false
);

create index if not exists claims_created_at_idx on public.claims (created_at desc);

-- 개인정보: RLS를 켜고 anon·authenticated 정책을 두지 않는다. 서버리스가 service role 키로만 쓴다.
alter table public.claims enable row level security;
```

- `status`에 check 제약 — 운영 보드가 Table Editor라 오타를 막을 곳이 DB뿐이다(**결정 3**)
- **적용은 사람이** Supabase 대시보드 SQL Editor에 붙여 넣는다(에이전트는 대시보드 접근이 없다). `create … if not exists`라 두 번
  돌려도 안전하다

### 2. 서버 순수 로직 — `server/claims.ts` 한 파일 (+ `server/claims.test.ts`)

브라우저 import 금지(머리 주석). `src/`를 import하지 않는다. **PostgREST·슬랙·검증·접수를 한 파일의 절(section)로 나눈다** —
처음엔 `server/supabase.ts`·`server/slack.ts`로 쪼갰는데, `server/` 파일끼리의 import는 Vercel·Vite 규칙상 `.js` 확장자여야 하고
`node --test`는 `.js`를 `.ts`로 되돌리지 않아 테스트가 모듈을 못 찾았다(`server/notion.ts → otp.js`가 테스트가 없는 이유). 이유는 파일
머리 주석에도 있다.

**PostgREST 절** — 얇은 호출 4개. 공통 헤더 `apikey: <key>` · `Authorization: Bearer <key>` · `Content-Type`.
호출마다 `AbortSignal.timeout(5000)`. 네트워크 예외는 잡아서 `{ ok: false, status: 0 }`류로 돌려주고 throw하지 않는다.

| 함수 | 요청 | 반환 |
| --- | --- | --- |
| `findByClientId(env, clientId)` | `GET /rest/v1/claims?client_id=eq.{id}&select=receipt_no&limit=1` | `string \| null` (receipt_no) |
| `lastReceiptNoOfDay(env, prefix)` | `GET /rest/v1/claims?receipt_no=like.{prefix}*&select=receipt_no&order=receipt_no.desc&limit=1` | `string \| null` |
| `insertClaim(env, row)` | `POST /rest/v1/claims`, `Prefer: return=representation` | `{ ok: true, id }` / `{ ok: false, conflict: 'receipt_no' \| 'client_id' \| null, status }` |
| `markSlackNotified(env, id)` | `PATCH /rest/v1/claims?id=eq.{id}` `{ slack_notified: true }`, `Prefer: return=minimal` | `void` — 실패 무시 |

- `insertClaim`의 충돌 분류: 응답 409 + 본문 `code === '23505'`이면 `message`·`details` 문자열에 `claims_receipt_no_key`가 있으면
  `'receipt_no'`, `claims_client_id_key`면 `'client_id'`, 둘 다 아니면 `null`
- `receipt_no`는 `BGN-`·숫자·하이픈뿐이라 like 패턴에 이스케이프가 필요 없다. `client_id`는 UUID 검증을 통과한 값만 온다

**슬랙 절**

- `buildClaimMessage({ receiptNo, hospitalName, visitDate, insurer, refCode, boardUrl }): string` — 순수 함수. **이름·전화번호·
  생년월일·반려동물 이름은 받지도 않는다**(타입에 없다):

  ```
  🐾 새 대리청구 신청 *BGN-260910-01*
  • 병원: 개냥동물병원
  • 진료일: 2026-09-08
  • 보험사: 삼성화재
  • 유입 코드: test          ← 없으면 「-」
  <https://supabase.com/dashboard/project/xxxx/editor|Supabase Table Editor에서 보기>
  ```
- `notifySlack(webhookUrl, text): Promise<boolean>` — `POST webhookUrl { text }`, `AbortSignal.timeout(3000)`, 비-2xx·예외는 `false`
- `boardUrl`은 `SUPABASE_URL`(`https://<ref>.supabase.co`)의 첫 호스트 라벨로 `https://supabase.com/dashboard/project/<ref>/editor`를
  만든다(`server/claims.ts`의 `boardUrlFrom(supabaseUrl)`, 순수). 새 env를 만들지 않는다(**결정 4**). 대시보드 URL이 바뀌면 이 한 곳

**검증·접수 절**

`validateClaimInput(input: unknown, todayKst: string): { ok: true; row: ClaimRow } | { ok: false; field: string }` — 순수. `ClaimRow`는
insert 본문 타입(= `ClaimPayload` + `client_id: string | null`, `consented_at` 없음). 클라이언트(`validateApplicant`·`validateTreatment`)
와 같은 규칙 + 길이 상한:

| 필드 | 규칙 (실패 시 `field`에 그 이름) |
| --- | --- |
| `client_id` | 없거나 null → null. 있으면 UUID v4 형식 문자열 |
| `guardian_name` | 문자열, trim 2~20자 |
| `guardian_phone` | `/^010-\d{4}-\d{4}$/` |
| `guardian_birth` | `YYYY-MM-DD` · 달력에 있는 날 · `todayKst` 이전 · **만 14세 이상**(연·월·일 비교, 생일 당일 14세) |
| `pet_name` | trim 1~20자 |
| `hospital_name` | trim 1~100자 |
| `hospital_address` | null 또는 trim ≤200자(빈 문자열은 null로) |
| `visit_date` | `YYYY-MM-DD` · 달력에 있는 날 · `todayKst` 이하 |
| `treatment_cost` | 정수 0 ~ 99,999,999 |
| `diagnosis` | null 또는 ≤200자 |
| `insurer` | trim 1~50자 |
| `product_name` | null 또는 ≤100자 |
| `required_docs` | null 또는 `{ insurer: string, claimType: string, hospitalIssued: string[], selfPrepared: string[], fallback: boolean }` — 배열 ≤50개·항목 ≤200자. 그 외 키는 버린다 |
| `consent_*` 5개 | 전부 `=== true` |
| `consent_version` | `/^consent-v\d+$/` |
| `ref_code` | null 또는 ≤32자 |

`receiptPrefix(now: Date): string` — `'BGN-' + YYMMDD + '-'`, YYMMDD는 KST(UTC+9). 순수.
`nextReceiptNo(prefix: string, last: string | null): string` — `last`가 null이면 `01`, 아니면 뒤 숫자 + 1을 2자리 패딩(100부터는 그대로). 순수.
`todayKst(now: Date): string` — `YYYY-MM-DD`. 검증의 「오늘」.

`createClaim(input: unknown, env: ClaimsEnv, now = new Date()): Promise<{ status: number; body: ClaimsBody }>`

```ts
export interface ClaimsEnv { supabaseUrl?: string; secretKey?: string; slackWebhookUrl?: string }
type ClaimsBody = { ok: true; receipt_no: string } | { ok: false; error: string; field?: string };
```

| 순서 | 무엇 | 실패 응답 |
| --- | --- | --- |
| 1 | `supabaseUrl`·`secretKey` 없으면 | 500 `server_not_configured` (`slackWebhookUrl`은 선택 — **결정 6**) |
| 2 | `validateClaimInput` | 400 `invalid_input` + `field` |
| 3 | `client_id`가 있으면 `findByClientId` → 있으면 **200 기존 `receipt_no`**, insert·슬랙 없음 | — |
| 4 | `lastReceiptNoOfDay` → `nextReceiptNo` → `insertClaim`. `receipt_no` 충돌이면 3→4를 **한 번 더**, 또 충돌이면 | 409 `receipt_conflict` |
| 4' | `client_id` 충돌(같은 신청이 동시에 두 번 온 경합)이면 `findByClientId`로 기존 번호 200 | 그래도 없으면 502 `supabase_error` |
| 5 | 조회·insert가 네트워크 실패·비-2xx | 502 `supabase_error` |
| 6 | `slackWebhookUrl` 있으면 `buildClaimMessage` → `notifySlack` → `true`면 `markSlackNotified`. **슬랙 실패해도 다음 줄로** | — |
| 7 | | 200 `{ ok: true, receipt_no }` |

응답 계약은 SSH-486이 이미 구현한 클라이언트(`src/lib/claims.ts`)와 같다 — 성공 `{ ok: true, receipt_no }`, 실패 비-2xx `{ ok: false, error }`.
`field`는 덤이다(클라이언트는 안 읽는다). 서버 로그(`console.error`)는 접수번호·error 코드·PostgREST 상태만 — 본문(개인정보)은 찍지 않는다.

**테스트 `server/claims.test.ts`** (`node:test`, `globalThis.fetch`를 URL·method로 분기하는 가짜 PostgREST·슬랙으로 교체, 호출 기록을 배열에 남긴다)

- `validateClaimInput`: PR #32 본문의 실제 payload(+ `client_id`)가 통과 · 전화 형식 · 만 14세 미만 · 생년월일 미래 · `2000-02-30` · 동의 하나 false ·
  `treatment_cost` 음수·소수·문자열 · `required_docs` 모양(배열이 아닌 값) · `consent_version` 형식 · `client_id` UUID 아님 · 문자열이 아닌 이름
- `receiptPrefix`: UTC 2026-09-10 14:59 → `BGN-260910-` · UTC 15:00 → `BGN-260911-`(KST 자정 경계)
- `nextReceiptNo`: `null` → `01` · `…-01` → `02` · `…-09` → `10` · `…-99` → `100`
- `createClaim` 성공: 조회 1 · insert 1(본문에 `consented_at` 없음, `receipt_no` 형식, `client_id` 그대로) · 슬랙 1(본문에 이름·전화·생년월일 **없음**, 접수번호·병원 있음) · PATCH 1 · 200
- `receipt_no` 충돌 1회 → 재조회 → `-02`로 성공 · 2회 → 409
- `client_id` 기존 행 → 200 기존 번호, insert 0 · 슬랙 0
- `client_id` insert 충돌 → 재조회로 200
- 슬랙 실패(500·예외) → 200, PATCH 0
- `slackWebhookUrl` 없음 → 200, 슬랙 0
- env 없음 → 500 · Supabase 502

### 3. 엔드포인트 — `api/claims.ts` + `vite.config.ts`

`api/claims.ts` — `api/subscribe.ts`와 같은 모양:

```ts
import { createClaim } from '../server/claims.js';
export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ ok: false, error: 'bad_request' }, { status: 400 }); }
  const result = await createClaim(input, {
    supabaseUrl: process.env.SUPABASE_URL,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  });
  return Response.json(result.body, { status: result.status });
}
```

`vite.config.ts` — `claimsApi(env)` 플러그인. `subscribeApi`를 본떠 POST만, 본문 상한 `1e5`, `createClaim(input, { supabaseUrl: env.SUPABASE_URL, … })`,
JSON 파싱 실패 400 `bad_request`. `server.middlewares.use('/api/claims', handler)` + `plugins` 배열에 추가.

### 4. 클라이언트 멱등 키 — SSH-486 코드 소폭 수정

- `src/apply/ApplyContext.tsx`: `clientId: string`을 value에 추가. `useState(() => crypto.randomUUID())`, 감싼 `dispatch`가 `reset`을
  받으면 새 UUID(주석에 「배경」의 이유)
- `src/apply/claimPayload.ts`: `ClaimPayload.client_id: string` + `toClaimPayload(state, refCode, clientId)`. 머리 주석의 계약 설명에 한 줄.
  `claimPayload.test.ts`: 기존 4건에 인자 추가 + `client_id` 매핑 1건
- `src/apply/steps/StepConsent.tsx#submit`: `useApply()`에서 `clientId`를 받아 `toClaimPayload(state, getRefCode(), clientId)`
- `src/lib/claims.ts`: 머리 주석 「서버는 SSH-544 — …」를 「서버는 `server/claims.ts` + `api/claims.ts`」로. 코드는 그대로

### 5. 환경변수 — `Project/.env.example`

```
# Supabase claims 저장 — 서버 전용. VITE_ 접두사를 붙이면 브라우저 번들에 들어가므로 절대 금지
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx

# 슬랙 Incoming Webhook — 없으면 알림만 건너뛰고 저장은 된다
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# Gemini 영수증 OCR (api/analyze-receipt) — SSH-543 때 빠진 것
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-3-flash-preview
```

- `SUPABASE_URL`은 `VITE_SUPABASE_URL`과 같은 값이지만 **이름을 따로 둔다** — 서버 코드가 `VITE_` 변수를 읽기 시작하면 「`VITE_`는 브라우저용」
  경계가 흐려진다(위키 ⑤). 키는 새 형식 `sb_secret_…`(대시보드 API Keys의 Secret key) 또는 legacy `service_role` JWT 둘 다 PostgREST가 받는다
- Vercel(Preview·Production) 등록과 로컬 `.env`는 **사람이** 한다. `.env`는 이 PR이 건드리지 않는다

### 6. 파일 목록

```
Project/supabase/schema.sql                                    1절 — claims DDL append
Project/server/claims.ts · server/claims.test.ts               2절 — PostgREST·슬랙·검증·접수번호·createClaim (한 파일)
Project/api/claims.ts                                          3절 — 서버리스 (신규)
Project/vite.config.ts                                         3절 — dev 미들웨어
Project/src/apply/ApplyContext.tsx                             4절 — clientId
Project/src/apply/claimPayload.ts · claimPayload.test.ts       4절 — client_id
Project/src/apply/steps/StepConsent.tsx · src/lib/claims.ts    4절
Project/.env.example                                           5절
docs/spec/SSH-544/{spec,tasks}.md                              이 문서
```

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 슬랙 채널·Incoming Webhook 생성 · 개인정보처리방침 v3(Supabase 수탁 추가) | SSH-474 · 성식. **v3 전에는 프로덕션 배포 금지**(위키 ⑫) |
| `apply_submit`·`apply_done`/`apply_error` 트래킹 · `supabase/queries.sql` 퍼널 · 프리뷰 3명 신청 배포 판정 · 프로덕션 | SSH-545 |
| `server/notion.ts`·OTP·`api/subscribe.ts` 삭제 | SSH-545 (위키 ⑦) |
| 봇·스팸 방어(rate limit·captcha) · 슬랙 자동 재시도 · 운영 UI(Table Editor로 대신) | 백로그 — 인증이 없어 거짓 신청은 병원 사전 연락이 유일한 검증(위키 ⑫ 리스크) |
| 단계 단위 브라우저 back · 액션 행 고정 | SSH-547 · SSH-548 |
| `client_id`를 `ApplyState`(reducer)에 넣는 것 | 하지 않음 — 「배경」 |

## 검증

- [x] `npm run build`(`tsc -b`) · `npm run lint` · `npm test` — `server/claims.test.ts` 신규 19건, `claimPayload.test.ts` 갱신 (80건, 2026-09-10)
- [x] **사람**: SQL Editor에 1절 DDL 적용 · 로컬 `.env`에 `SUPABASE_URL`·`SUPABASE_SECRET_KEY` (2026-09-10) · [ ] Vercel Preview 환경변수 — 아직
- [x] 로컬 `npm run dev` `/apply?r=test` S1~S5 → 「신청하기」 → S6 접수번호(`BGN-260910-03`, curl 2건 뒤) · Table Editor 행 1개(`consented_at` 채워짐 ·
      `status` 신규 · `slack_notified` false · `ref_code` test) · 같은 날 2번째 → `-02`
- [x] 멱등: `curl`로 같은 `client_id` 본문 2회 → 행 1개, 같은 `receipt_no`
- [x] `curl` 400: 전화 형식 · 동의 하나 false · JSON 아님(`bad_request`) · env 없이 500 `server_not_configured` · anon 키 select 빈 배열·insert 401(RLS)
- [ ] 슬랙: 테스트(스텁)로만. **webhook이 생기면** 로컬 `.env`에 넣고 1통 + `slack_notified` true 확인 — PR 본문에 「남은 검증」
- [ ] Vercel 프리뷰 `/apply?r=test`에서 끝까지(환경변수 등록 뒤)
- [x] UI 변경 없음 → 스크린샷 「해당 없음」. S6에 실제 접수번호가 뜬 1440·390을 검증 기록으로 첨부

## 1차 리뷰 결정 요청

1. **`client_id` 멱등 키** — 컬럼 unique · 서버는 같은 값이면 기존 번호 200 · 클라이언트는 Provider가 UUID를 들고 `reset`에서만 갱신 (계획 단계 사용자 확정)
2. **접수번호 NN = 당일 마지막 NN + 1** — 티켓의 「행 수 + 1」과 결과는 같고 행이 지워져도 충돌하지 않는다. unique + 1회 재시도는 그대로 — 「배경」
3. **`status` check 제약**(신규·확인중·서류확보·청구완료) — Table Editor 오타 방지. 상태를 늘리려면 `alter table … drop/add constraint`
4. **슬랙 링크는 `SUPABASE_URL`에서 프로젝트 ref를 뽑아** 대시보드 editor로 — 새 env 없음
5. **서버 검증은 클라이언트 규칙 복제** — `server/`가 `src/`를 import하지 않는 경계 유지 — 「배경」
6. **`SLACK_WEBHOOK_URL` 없으면 알림만 건너뛰고 200** — webhook이 아직 없어도 프리뷰 insert 검증이 된다
7. **`consented_at`은 DB default `now()`** — 서버가 값을 만들지 않는다
8. **서버 로그에 본문을 찍지 않는다** — Vercel 로그도 개인정보 저장소가 된다. 접수번호·error 코드·상태 코드만
