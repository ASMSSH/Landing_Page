import assert from 'node:assert/strict';
import test from 'node:test';
import { planStepChange, readEntryStep, resolvePopstate, toHistoryState } from './stepHistory.ts';

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
  assert.deepEqual(resolvePopstate(4, 5, true), { go: 1 });
  assert.deepEqual(resolvePopstate(6, 5, true), { go: -1 });
  assert.deepEqual(resolvePopstate(5, 5, true), { entryStep: 5 });
});

test('popstate ③ 같은 단계 항목은 항목 단계만 기억한다 (UI가 걷은 항목에 도착)', () => {
  assert.deepEqual(resolvePopstate(2, 2, false), { entryStep: 2 });
});

test('popstate ④ 앞으로가기·옛 항목은 현재 단계 항목으로 되돌린다', () => {
  assert.deepEqual(resolvePopstate(3, 2, false), { go: -1 });
  assert.deepEqual(resolvePopstate(5, 1, false), { go: -4 });
  assert.deepEqual(resolvePopstate(6, 5, false), { go: -1 });
});

test('popstate ⑤ 뒤로는 그 단계로 goto — 두 항목을 건너뛰어도 맞다', () => {
  assert.deepEqual(resolvePopstate(2, 3, false), { entryStep: 2, action: { type: 'goto', step: 2 } });
  assert.deepEqual(resolvePopstate(1, 4, false), { entryStep: 1, action: { type: 'goto', step: 1 } });
});

test('popstate ⑥ 접수 완료에서 뒤로가기는 reset 후 단계 수만큼 걷어 나간다', () => {
  assert.deepEqual(resolvePopstate(5, 6, false), { entryStep: 1, action: { type: 'reset' }, go: -5 });
  assert.deepEqual(resolvePopstate(1, 6, false), { entryStep: 1, action: { type: 'reset' }, go: -1 });
});

test('popstate — 항목 단계를 기억하면 뒤이은 상태 변화가 push·go를 또 하지 않는다', () => {
  // 뒤로가기로 3→2: 훅이 entryStep=2를 먼저 기억하고 goto 2를 dispatch → 상태 2 → planStepChange(2, 2)는 없음
  const plan = resolvePopstate(2, 3, false);
  assert.equal(planStepChange(plan.entryStep!, 2), null);
  // S6 뒤로가기: entryStep=1 기억 + reset → 상태 1 → planStepChange(1, 1)는 없음 (go(-e)는 popstate 계획이 이미 한다)
  const done = resolvePopstate(4, 6, false);
  assert.equal(planStepChange(done.entryStep!, 1), null);
});
