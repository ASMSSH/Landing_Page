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

/**
 * popstate 처리 계획.
 * - `entryStep`: 도착한 항목이 가리키는 단계를 훅이 기억하게 하는 값 — 뒤이은 상태 변화가 push/go를 또 하지 않게
 * - `go`: 걷을 항목 수. `goArrivesAt`은 그 traversal이 도착할 항목의 단계 — 훅이 기대 큐에 넣어 두고 그 popstate는 규칙에 태우지 않는다
 *   (아래 takeExpectedArrival)
 */
export interface PopstatePlan {
  entryStep?: ApplyStep;
  action?: ApplyAction;
  go?: number;
  goArrivesAt?: ApplyStep;
}

/**
 * 우리가 건 `history.go`의 도착 popstate인지 판정한다. 맞으면 큐에서 빼고 true — 훅은 항목 단계만 기억하고 규칙을 적용하지 않는다.
 * 아니면 큐를 비우고 false — 기대와 다른 항목이 왔다는 건 기대 모델이 어긋난 것이라(무시된 go 등) 처음부터 다시 본다.
 *
 * 왜 필요한가(AI 리뷰 P2): `history.go`는 비동기라 「← 이전」을 popstate가 오기 전에 두 번 누르면 첫 popstate(항목 4)가 현재 단계(3)보다
 * 커서 규칙 ④(앞으로가기 되돌림)에 걸려 go를 한 번 더 하고, 결국 5→3이 아니라 2에 도착했다. 큐가 그 popstate를 "우리 것"으로 소비한다.
 * popstate는 traversal 순서대로 오므로 큐 머리와 비교하면 된다.
 */
export function takeExpectedArrival(queue: ApplyStep[], entry: ApplyStep | null): boolean {
  if (queue.length === 0) return false;
  if (queue[0] === entry) {
    queue.shift();
    return true;
  }
  queue.length = 0;
  return false;
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
  if (locked) return entry === current ? { entryStep: entry } : { go: current - entry, goArrivesAt: current };
  // ③ 같은 단계 — UI가 걷은 항목에 도착한 것
  if (entry === current) return { entryStep: entry };
  // ④ 앞으로가기, 또는 새로고침 뒤 남은 옛 항목 — 되돌린다. 앞 단계로 건너뛰는 건 reducer도 막는다
  if (entry > current) return { go: current - entry, goArrivesAt: current };
  // ⑥ 접수 완료(6)는 종착 — 되돌아가 「신청하기」를 또 누르면 중복 접수다. 새 신청으로 비우고(reset) 항목 [1]까지 걷어 빈 1단계에 선다.
  //    랜딩으로 나가는 길은 「홈으로」(StepDone)다. 처음엔 go(-e)로 /apply 앞 항목(랜딩)까지 나가려 했는데, DM 링크를 새 탭·인앱
  //    브라우저로 열면 /apply가 탭의 첫 항목이라 그 항목이 없고 go가 조용히 무시됐다(AI 리뷰 P3). [1]은 우리가 쌓은 항목이라 어떤 진입이든 있다
  if (current === DONE_STEP) {
    const plan: PopstatePlan = { entryStep: 1, action: { type: 'reset' } };
    if (entry > 1) {
      plan.go = 1 - entry;
      plan.goArrivesAt = 1;
    }
    return plan;
  }
  // ⑤ 뒤로 — 그 단계로. prev가 아니라 goto라 두 항목을 한 번에 건너뛴 경우도 맞다
  return { entryStep: entry, action: { type: 'goto', step: entry } };
}
