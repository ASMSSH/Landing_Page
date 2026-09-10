import assert from 'node:assert/strict';
import test from 'node:test';
import { todayIso, validateTreatment } from './validateTreatment.ts';
import type { Treatment } from './state.ts';

const TODAY = '2026-09-10';
const ok: Treatment = {
  hospitalName: '개냥동물병원',
  hospitalAddress: '',
  visitDate: '2026-09-08',
  treatmentCost: '58000',
  diagnosis: '',
};

test('필수 3칸이 채워지면 오류가 없다 — 주소·병명은 비어도 된다', () => {
  assert.deepEqual(validateTreatment(ok, TODAY), {});
});

test('필수 3칸이 비면 칸마다 메시지가 붙는다', () => {
  const errors = validateTreatment(
    { hospitalName: '  ', hospitalAddress: '', visitDate: '', treatmentCost: '', diagnosis: '' },
    TODAY,
  );
  assert.deepEqual(Object.keys(errors).sort(), ['hospitalName', 'treatmentCost', 'visitDate']);
});

test('진료일은 오늘까지 허용하고 미래는 막는다', () => {
  assert.deepEqual(validateTreatment({ ...ok, visitDate: TODAY }, TODAY), {});
  assert.equal(validateTreatment({ ...ok, visitDate: '2026-09-11' }, TODAY).visitDate, '오늘 이전 날짜만 가능해요');
});

test('진료일 형식이 YYYY-MM-DD가 아니면 오류다', () => {
  assert.equal(validateTreatment({ ...ok, visitDate: '2026.09.08' }, TODAY).visitDate, '날짜 형식이 맞지 않아요');
  assert.equal(validateTreatment({ ...ok, visitDate: '2026-13-40' }, TODAY).visitDate, '날짜 형식이 맞지 않아요');
});

test('진료비는 0원이거나 숫자가 없으면 오류다', () => {
  assert.equal(validateTreatment({ ...ok, treatmentCost: '0' }, TODAY).treatmentCost, '진료비를 적어 주세요');
  assert.equal(validateTreatment({ ...ok, treatmentCost: '원' }, TODAY).treatmentCost, '진료비를 적어 주세요');
  assert.deepEqual(validateTreatment({ ...ok, treatmentCost: '58,000' }, TODAY), {});
});

test('todayIso는 로컬 날짜를 YYYY-MM-DD로 만든다', () => {
  assert.equal(todayIso(new Date(2026, 8, 5)), '2026-09-05');
});
