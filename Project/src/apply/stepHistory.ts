// /apply 단계와 브라우저 history를 잇는 규칙. React·DOM 의존이 없는 순수 함수라 node:test로 검증한다 (stepHistory.test.ts).
// 실제 history API 호출과 popstate 리스너는 useStepHistory.ts가 맡는다.
//
// 배경(SSH-547): 단계(S1~S6)는 URL이 아니라 reducer 상태다(SSH-542 결정). 그래서 /apply는 history 항목이 하나뿐이었고
// 브라우저 뒤로가기(스와이프 백)가 이전 단계가 아니라 랜딩으로 나가 입력값이 전부 사라졌다.
// 단계가 오를 때 항목을 하나씩 쌓고(pushState — URL은 /apply?r=… 그대로), popstate에서 그 항목의 단계로 되돌린다.
//
// 항목 모델:  [랜딩] [1] [2] [3] … [k]   — 단계 k에 있으면 앞에 단계 1..k-1 항목이 하나씩 있다.
// 상태(reducer)가 정본이고 history는 거울이다. 「← 이전」·프로그레스는 지금처럼 dispatch하고, 훅이 history.go로 항목을 걷는다.
// 반대로(버튼을 history.back으로) 하면 새로고침 뒤처럼 history가 어긋났을 때 버튼이 죽는다.

import { DONE_STEP, type ApplyAction, type ApplyStep } from './state.ts';

/** history.state에 넣는 값. S5 동의 전문이 넣는 `{ applyConsent }` 항목(StepConsent)에는 이 키가 없다 — 그 항목은 무시한다 */
export interface StepHistoryState {
  applyStep: ApplyStep;
}

export function toHistoryState(step: ApplyStep): StepHistoryState {
  return { applyStep: step };
}

/** history.state에서 단계를 읽는다. 우리가 넣은 항목이 아니면 null */
export function readEntryStep(state: unknown): ApplyStep | null {
  if (typeof state !== 'object' || state === null) return null;
  const step = (state as { applyStep?: unknown }).applyStep;
  return typeof step === 'number' && Number.isInteger(step) && step >= 1 && step <= DONE_STEP ? (step as ApplyStep) : null;
}

/** 단계가 바뀌었을 때 history를 어떻게 맞출지. `entryStep`은 지금 history 항목이 가리키는 단계 */
export type StepChangePlan = { kind: 'push' } | { kind: 'go'; delta: number } | null;

export function planStepChange(entryStep: ApplyStep, nextStep: ApplyStep): StepChangePlan {
  if (nextStep === entryStep) return null;
  // 오른다(next · 제출 성공 goto 6): 항목을 하나 쌓는다. 6도 똑같이 — 뒤로가기 때 단계 수만큼 걷어 나가기 위해서다(아래 ⑥)
  if (nextStep > entryStep) return { kind: 'push' };
  // 내린다(UI의 prev · goto · reset): 그만큼 항목을 걷는다. 도착 popstate는 같은 단계라 무시된다(아래 ③)
  return { kind: 'go', delta: nextStep - entryStep };
}

/** popstate 처리 계획. `entryStep`은 도착한 항목이 가리키는 단계를 훅이 기억하게 하는 값 — 뒤이은 상태 변화가 push/go를 또 하지 않게 */
export interface PopstatePlan {
  entryStep?: ApplyStep;
  action?: ApplyAction;
  go?: number;
}

const NOTHING: PopstatePlan = {};

/**
 * popstate로 도착한 항목(`entry`)과 현재 단계로 무엇을 할지 정한다.
 * `locked`는 S5 전송 중 — 「← 이전」·프로그레스가 잠기는 것과 같은 규칙으로 뒤로가기도 되돌린다(전송 중 떠나면 접수는 되는데 접수번호를 못 본다).
 */
export function resolvePopstate(entry: ApplyStep | null, current: ApplyStep, locked: boolean): PopstatePlan {
  // ① 우리 항목이 아니다(동의 전문 항목 등) — 무시
  if (entry === null) return NOTHING;
  // ② 전송 중 — 되돌린다
  if (locked) return entry === current ? { entryStep: entry } : { go: current - entry };
  // ③ 같은 단계 — UI가 걷은 항목에 도착한 것
  if (entry === current) return { entryStep: entry };
  // ④ 앞으로가기, 또는 새로고침 뒤 남은 옛 항목 — 되돌린다. 앞 단계로 건너뛰는 건 reducer도 막는다
  if (entry > current) return { go: current - entry };
  // ⑥ 접수 완료(6)는 종착 — 되돌아가 「신청하기」를 또 누르면 중복 접수다. 새 신청으로 비우고 단계 수만큼 걷어 /apply 앞(랜딩)으로 나간다.
  //    reset을 먼저 하는 이유: 항목 수가 어긋나 페이지 안에 남더라도 빈 1단계(새 멱등 키)여야 한다
  if (current === DONE_STEP) return { entryStep: 1, action: { type: 'reset' }, go: -entry };
  // ⑤ 뒤로 — 그 단계로. prev가 아니라 goto라 두 항목을 한 번에 건너뛴 경우도 맞다
  return { entryStep: entry, action: { type: 'goto', step: entry } };
}
