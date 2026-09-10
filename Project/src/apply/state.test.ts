import assert from 'node:assert/strict';
import test from 'node:test';
import { applyReducer, initialApplyState, type ApplyState } from './state.ts';

function at(step: ApplyState['step'], extra: Partial<ApplyState> = {}): ApplyState {
  return { ...initialApplyState, step, ...extra };
}

test('next는 1→2로 가고 5에서 멈춘다', () => {
  assert.equal(applyReducer(at(1), { type: 'next' }).step, 2);
  assert.equal(applyReducer(at(5), { type: 'next' }).step, 5);
});

test('prev는 2→1로 가고 1에서 멈춘다', () => {
  assert.equal(applyReducer(at(2), { type: 'prev' }).step, 1);
  assert.equal(applyReducer(at(1), { type: 'prev' }).step, 1);
});

test('goto는 뒤로만 간다 — 앞으로 건너뛰지 못한다', () => {
  assert.equal(applyReducer(at(4), { type: 'goto', step: 2 }).step, 2);
  assert.equal(applyReducer(at(2), { type: 'goto', step: 4 }).step, 2);
  assert.equal(applyReducer(at(3), { type: 'goto', step: 3 }).step, 3);
});

test('접수 완료(6)는 접수번호가 있어야 갈 수 있고, 거기서 prev는 안 된다', () => {
  assert.equal(applyReducer(at(5), { type: 'goto', step: 6 }).step, 5);
  const done = applyReducer(at(5, { receiptNo: 'BGN-260910-01' }), { type: 'goto', step: 6 });
  assert.equal(done.step, 6);
  assert.equal(applyReducer(done, { type: 'prev' }).step, 6);
  assert.equal(applyReducer(done, { type: 'next' }).step, 6);
});

test('set* patch는 해당 묶음만 병합하고 나머지는 그대로 둔다', () => {
  const s1 = applyReducer(initialApplyState, { type: 'setTreatment', patch: { hospitalName: '개냥동물병원' } });
  assert.equal(s1.treatment.hospitalName, '개냥동물병원');
  assert.equal(s1.treatment.visitDate, '');
  assert.equal(s1.insurance.insurer, '');

  const s2 = applyReducer(s1, { type: 'setTreatment', patch: { visitDate: '2026-09-08' } });
  assert.equal(s2.treatment.hospitalName, '개냥동물병원');
  assert.equal(s2.treatment.visitDate, '2026-09-08');

  const s3 = applyReducer(s2, { type: 'setConsents', patch: { terms: true } });
  assert.equal(s3.consents.terms, true);
  assert.equal(s3.consents.privacy, false);
  assert.equal(s3.treatment.hospitalName, '개냥동물병원');
});

test('reset은 초기 상태로 돌아간다', () => {
  const filled = applyReducer(at(4), { type: 'setApplicant', patch: { name: '김보호' } });
  assert.deepEqual(applyReducer(filled, { type: 'reset' }), initialApplyState);
});

test('reducer는 입력 상태를 바꾸지 않는다', () => {
  const before = at(2);
  const snapshot = structuredClone(before);
  applyReducer(before, { type: 'next' });
  applyReducer(before, { type: 'setInsurance', patch: { insurer: '삼성화재' } });
  assert.deepEqual(before, snapshot);
});
