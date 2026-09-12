import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCost, normalizeVisitDate, receiptToTreatment } from './receiptToTreatment.ts';
import type { GeminiAnalysis } from '../lib/geminiAnalyze.ts';

const base: GeminiAnalysis = {
  docType: '진료비 영수증',
  hospital: '',
  address: '',
  date: '',
  diag: '',
  cost: '',
  surgery: false,
  claimType: 'manual',
  summary: '',
  evidence: [],
  warnings: [],
};

test('병원·주소·날짜·금액·병명을 Treatment 이름으로 옮긴다', () => {
  const patch = receiptToTreatment({
    ...base,
    hospital: ' 개냥동물병원 ',
    address: '서울 마포구 양화로 12',
    date: '2026.09.08',
    diag: '피부염 치료',
    cost: '58,000',
  });
  assert.deepEqual(patch, {
    hospitalName: '개냥동물병원',
    hospitalAddress: '서울 마포구 양화로 12',
    visitDate: '2026-09-08',
    treatmentCost: '58000',
    diagnosis: '피부염 치료',
  });
});

test('날짜는 점·하이픈·슬래시·한글 표기를 전부 YYYY-MM-DD로 맞춘다', () => {
  assert.equal(normalizeVisitDate('2026.09.08'), '2026-09-08');
  assert.equal(normalizeVisitDate('2026-09-08'), '2026-09-08');
  assert.equal(normalizeVisitDate('2026/9/8'), '2026-09-08');
  assert.equal(normalizeVisitDate('2026년 9월 8일'), '2026-09-08');
  assert.equal(normalizeVisitDate('2026. 09. 08.'), '2026-09-08');
});

test('읽을 수 없는 날짜는 빈 문자열이고 patch에서 빠진다', () => {
  assert.equal(normalizeVisitDate('09/08'), '');
  assert.equal(normalizeVisitDate('2026.13.01'), '');
  // 범위는 맞지만 달력에 없는 날짜 — Date.parse는 3월 2일로 넘겨 버린다
  assert.equal(normalizeVisitDate('2026.02.30'), '');
  assert.equal(normalizeVisitDate('2026.04.31'), '');
  assert.equal(normalizeVisitDate('2024.02.29'), '2024-02-29'); // 윤년은 통과
  assert.equal(normalizeVisitDate('날짜 없음'), '');
  const patch = receiptToTreatment({ ...base, date: '09/08', hospital: '개냥동물병원' });
  assert.deepEqual(patch, { hospitalName: '개냥동물병원' });
});

test('금액은 쉼표·원·공백을 떼고 숫자만 남긴다', () => {
  assert.equal(normalizeCost('58,000'), '58000');
  assert.equal(normalizeCost('58,000원'), '58000');
  assert.equal(normalizeCost('₩ 1,234,500'), '1234500');
  assert.equal(normalizeCost('0'), '0');
  assert.equal(normalizeCost('금액 없음'), '');
});

test('빈 칸은 patch에 넣지 않는다 — 사용자가 적은 값을 덮지 않게', () => {
  assert.deepEqual(receiptToTreatment(base), {});
  assert.deepEqual(receiptToTreatment({ ...base, hospital: '   ', cost: '원' }), {});
});
