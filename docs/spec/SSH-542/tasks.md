# SSH-542 — 작업 목록 (`/apply` 진입점 + 페이지 셸)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(상태)에서 바깥(화면·연결)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/#542` (base: `dev`)

- [x] `docs/spec/SSH-542/spec.md` — 배경·범위 7절·범위 밖·검증·남는 결정
- [x] `docs/spec/SSH-542/tasks.md`
- [ ] **커밋** `docs: SSH-542 spec·tasks 작성`
- [ ] **Draft PR 생성 후 멈춘다** — `/apply 진입점 + 페이지 셸 구성(SSH-542)`, base `dev`.
      1차 리뷰(작업 계획)를 받은 뒤 아래 1~6을 같은 브랜치에서 잇는다

## 1. 상태 — spec 5절

- [ ] `src/apply/steps.ts` — `STEPS` 5개 (key · label · 헤딩 제목/설명 · 주 버튼 라벨)
- [ ] `src/apply/state.ts` — `ApplyState`·`ApplyAction`·`initialState`·`applyReducer`
  - [ ] 필드명을 SSH-544 `claims` 컬럼과 1:1 (camelCase)
  - [ ] `next` 5에서 정지 · `prev` 1에서 정지 · `goto` 뒤로만 · `reset`
- [ ] `src/apply/state.test.ts` — 경계 3건 + patch 병합 + reset
- [ ] `src/apply/ApplyContext.tsx` — `ApplyProvider` · `useApply()` (MvpContext 패턴)
- [ ] **커밋** `feat: /apply 단계 상태 reducer와 컨텍스트 추가`

## 2. 셸 컴포넌트 — spec 4절

- [ ] `components/icons.tsx`에 `check` 없으면 추가
- [ ] `src/apply/ApplyHeader.tsx` — 제목 + 부제 + BETA 배지
- [ ] `src/apply/ApplyProgress.tsx` — 5단계, 완료/현재/미완 3상태, 완료 단계 클릭 → `goto`
- [ ] `src/apply/StepHeading.tsx` — 원 번호 + 제목 + 설명
- [ ] `src/apply/steps/StepPlaceholder.tsx` — 빈 패널 (「이 단계는 준비 중이에요」 정도의 한 줄)
- [ ] `src/apply/ApplyRail.tsx` — 신청 요약 카드(5행, 빈 값 `—`) + 이렇게 진행돼요 카드(4줄, 마지막 줄 인스타 링크)
- [ ] `src/apply/ApplyActions.tsx` — `n / 5` · 이전(1단계 숨김) · 주 버튼(라벨은 `STEPS`에서)
- [ ] `src/apply/ApplyFooter.tsx` — 한 줄
- [ ] `src/apply/ApplyPage.tsx` — 위를 조립. `ApplyProvider`로 감싸고 `Nav variant="apply"`
- [ ] **커밋** `feat: /apply 페이지 셸 컴포넌트 추가`

## 3. 스타일 — spec 6절

- [ ] `src/styles/apply.css` — `apply-` 접두사, 토큰·`.btn`·`.field` 재사용
  - [ ] 컨테이너 1040 / 본문 2열 680+32+328
  - [ ] ≤1024 메인 `minmax(0,1fr)` · ≤768 1열(레일 아래) · ≤480 프로그레스 압축
  - [ ] `min-height: 100dvh` + 푸터 `margin-top: auto`
- [ ] **커밋** `style: /apply 셸 레이아웃과 반응형 스타일 추가`

## 4. 라우팅 + Nav — spec 1절

- [ ] `src/components/Nav.tsx` — `variant?: 'landing' | 'apply'`. apply: 링크 `/#problem` 등 절대 경로, CTA 「무료로 청구 맡기기」 `href="/apply"`. 기본값은 지금 동작 그대로
- [ ] `src/App.tsx` — `pathname === '/apply'`(트레일링 슬래시 허용) → `ApplyPage`, 아니면 기존 랜딩
- [ ] `src/main.tsx` — `observeSections`를 랜딩일 때만
- [ ] **커밋** `feat: /apply 경로를 App에서 분기`

## 5. SEO — spec 3절

- [ ] `src/apply/useApplyMeta.ts` — 마운트 시 title·description·canonical·og:url/title/description 교체, 언마운트 시 복원
- [ ] `public/sitemap.xml` — `/apply` 추가
- [ ] **커밋** `feat: /apply 런타임 메타와 sitemap 등록`

## 6. 배포 — spec 2절

- [ ] `vercel.json` — SPA rewrite, `api/` 제외
- [ ] **커밋** `chore: /apply 새로고침용 Vercel SPA rewrite 추가`

## 7. 검증 — spec 「검증」

- [ ] `npm run build` · `npm run lint` · `node --test src/apply/state.test.ts`
- [ ] 로컬 `/apply?r=test` 왕복 · 랜딩 `/` 무변화
- [ ] Vercel 프리뷰: `/apply?r=test` 새로고침 · 정적 파일 4종 원본 · `/api/claim-documents` JSON
- [ ] 스크린샷 1440 · 1024 · 768 · 390 → PR 본문
- [ ] PR 본문 갱신(문서 요약 → 실제 구현) + `/pr-review`는 별도 서브에이전트로
- [ ] Ready 전환·Jira 검토 중 이동은 사람이 한다 — 남았다고 보고
