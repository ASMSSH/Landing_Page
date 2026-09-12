import assert from 'node:assert/strict';
import test from 'node:test';
import { planStepChange, readEntryStep, resolvePopstate, takeExpectedArrival, toHistoryState } from './stepHistory.ts';
import type { ApplyStep } from './state.ts';

test('readEntryStep은 우리가 넣은 항목만 단계로 읽는다', () => {
  assert.equal(readEntryStep(toHistoryState(3)), 3);
  assert.equal(readEntryStep({ applyStep: 6 }), 6);
  assert.equal(readEntryStep(null), null);
  assert.equal(readEntryStep(undefined), null);
  assert.equal(readEntryStep({ applyConsent: 'terms' }), null);
  assert.equal(readEntryStep({ applyStep: 0 }), null);
  assert.equal(readEntryStep({ applyStep: 7 }), null);
  assert.equal(readEntryStep({ applyStep: '2' }), null);
  assert.equal(readEntryStep({ applyStep: 2.5 }), null);
});

test('planStepChange — 단계가 오르면 push, 내리면 그만큼 go, 같으면 없음', () => {
  assert.deepEqual(planStepChange(1, 2), { kind: 'push' });
  assert.deepEqual(planStepChange(5, 6), { kind: 'push' });
  assert.deepEqual(planStepChange(3, 2), { kind: 'go', delta: -1 });
  assert.deepEqual(planStepChange(5, 2), { kind: 'go', delta: -3 });
  assert.deepEqual(planStepChange(6, 1), { kind: 'go', delta: -5 });
  assert.equal(planStepChange(2, 2), null);
});

test('popstate ① 우리 항목이 아니면 무시한다 (동의 전문 항목)', () => {
  assert.deepEqual(resolvePopstate(null, 5, false), {});
});

test('popstate ② 전송 중엔 되돌린다', () => {
  assert.deepEqual(resolvePopstate(4, 5, true), { go: 1, goArrivesAt: 5 });
  assert.deepEqual(resolvePopstate(6, 5, true), { go: -1, goArrivesAt: 5 });
  assert.deepEqual(resolvePopstate(5, 5, true), { entryStep: 5 });
});

test('popstate ③ 같은 단계 항목은 항목 단계만 기억한다 (UI가 걷은 항목에 도착)', () => {
  assert.deepEqual(resolvePopstate(2, 2, false), { entryStep: 2 });
});

test('popstate ④ 앞으로가기·옛 항목은 현재 단계 항목으로 되돌린다', () => {
  assert.deepEqual(resolvePopstate(3, 2, false), { go: -1, goArrivesAt: 2 });
  assert.deepEqual(resolvePopstate(5, 1, false), { go: -4, goArrivesAt: 1 });
  assert.deepEqual(resolvePopstate(6, 5, false), { go: -1, goArrivesAt: 5 });
});

test('popstate ⑤ 뒤로는 그 단계로 goto — 두 항목을 건너뛰어도 맞다', () => {
  assert.deepEqual(resolvePopstate(2, 3, false), { entryStep: 2, action: { type: 'goto', step: 2 } });
  assert.deepEqual(resolvePopstate(1, 4, false), { entryStep: 1, action: { type: 'goto', step: 1 } });
});

test('popstate ⑥ 접수 완료에서 뒤로가기는 reset 후 항목 [1]까지 걷어 빈 1단계에 선다', () => {
  assert.deepEqual(resolvePopstate(5, 6, false), { entryStep: 1, action: { type: 'reset' }, go: -4, goArrivesAt: 1 });
  assert.deepEqual(resolvePopstate(2, 6, false), { entryStep: 1, action: { type: 'reset' }, go: -1, goArrivesAt: 1 });
  // 이미 [1]에 도착했으면 go(0)을 부르지 않는다 — go(0)은 새로고침이다
  assert.deepEqual(resolvePopstate(1, 6, false), { entryStep: 1, action: { type: 'reset' } });
});

test('popstate — 항목 단계를 기억하면 뒤이은 상태 변화가 push·go를 또 하지 않는다', () => {
  // 뒤로가기로 3→2: 훅이 entryStep=2를 먼저 기억하고 goto 2를 dispatch → 상태 2 → planStepChange(2, 2)는 없음
  const plan = resolvePopstate(2, 3, false);
  assert.equal(planStepChange(plan.entryStep!, 2), null);
  // S6 뒤로가기: entryStep=1 기억 + reset → 상태 1 → planStepChange(1, 1)는 없음 (go(1-e)는 popstate 계획이 이미 한다)
  const done = resolvePopstate(4, 6, false);
  assert.equal(planStepChange(done.entryStep!, 1), null);
});

test('takeExpectedArrival — 우리가 건 go의 도착 popstate는 큐 머리와 맞으면 소비하고, 아니면 큐를 비운다', () => {
  const queue: ApplyStep[] = [4, 3];
  assert.equal(takeExpectedArrival(queue, 4), true);
  assert.deepEqual(queue, [3]);
  assert.equal(takeExpectedArrival(queue, 2), false); // 기대(3)와 다른 항목 — 기대 모델이 어긋났다
  assert.deepEqual(queue, []);
  assert.equal(takeExpectedArrival(queue, 2), false); // 빈 큐면 항상 false
  assert.equal(takeExpectedArrival([1], null), false);
});

test('「← 이전」 연타(AI 리뷰 P2) — 5→4→3으로 두 번 내리고 popstate가 늦게 와도 2로 넘어가지 않는다', () => {
  // 훅의 흐름을 순수 함수로 재연: UI가 단계를 내릴 때마다 go를 걸고 도착 항목을 큐에 넣는다
  const queue: ApplyStep[] = [];
  let step: ApplyStep = 5;
  let entry: ApplyStep = 5;
  const uiPrev = () => {
    step = (step - 1) as ApplyStep;
    const plan = planStepChange(entry, step);
    assert.deepEqual(plan, { kind: 'go', delta: -1 });
    entry = step;
    queue.push(step);
  };
  uiPrev();
  uiPrev();
  // 이제서야 popstate 두 개가 순서대로 도착한다 — 항목 4, 항목 3
  for (const arrived of [4, 3] as const) {
    if (takeExpectedArrival(queue, arrived)) continue; // 우리 것 — 규칙 ④(되돌림)를 타지 않는다
    assert.fail(`항목 ${arrived}는 기대한 도착이어야 한다`);
  }
  assert.equal(step, 3);
  assert.equal(entry, 3);
  assert.deepEqual(queue, []);
  // 그 뒤의 진짜 뒤로가기(항목 2)는 정상 규칙 ⑤로 간다
  assert.equal(takeExpectedArrival(queue, 2), false);
  assert.deepEqual(resolvePopstate(2, step, false), { entryStep: 2, action: { type: 'goto', step: 2 } });
});
