// 영수증 분석 응답(GeminiAnalysis)을 /apply S1 상태(Treatment)의 patch로 바꾼다.
// 순수 함수 — node:test로 검증한다 (receiptToTreatment.test.ts).
//
// 형식 차이를 여기서 흡수한다:
//   date "2026.09.08" → visitDate "2026-09-08" (input[type=date]·claims.visit_date 형식)
//   cost "58,000"     → treatmentCost "58000"  (요약 레일·claims.treatment_cost는 숫자만)
// 못 읽은 칸(빈 문자열·해석 불가)은 patch에서 뺀다 — 사용자가 이미 적은 값을 지우지 않게.

import type { GeminiAnalysis } from '../lib/geminiAnalyze.ts';
import type { Treatment } from './state.ts';

/** 분석 응답의 date 문자열을 YYYY-MM-DD로. 못 읽으면 빈 문자열. */
export function normalizeVisitDate(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  // 2026.09.08 / 2026-09-08 / 2026/9/8 / 2026년 9월 8일 / 2026. 09. 08.
  const m = s.match(/(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);
  if (!m) return '';
  const [, y, mo, d] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (!isRealDate(year, month, day)) return '';
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 달력에 실제로 있는 날짜인가. `2026-02-30`처럼 범위는 맞지만 존재하지 않는 날짜를 거른다 —
 * `Date.parse`는 이런 값을 3월 2일로 넘겨 버려서 쓸 수 없다 (AI 리뷰 P3 반영, 2026-09-10).
 */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

/** 분석 응답의 cost 문자열에서 숫자만. 숫자가 없으면 빈 문자열. */
export function normalizeCost(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits;
}

export function receiptToTreatment(analysis: GeminiAnalysis): Partial<Treatment> {
  const patch: Partial<Treatment> = {};
  const hospitalName = analysis.hospital.trim();
  const hospitalAddress = analysis.address.trim();
  const visitDate = normalizeVisitDate(analysis.date);
  const treatmentCost = normalizeCost(analysis.cost);
  const diagnosis = analysis.diag.trim();

  if (hospitalName) patch.hospitalName = hospitalName;
  if (hospitalAddress) patch.hospitalAddress = hospitalAddress;
  if (visitDate) patch.visitDate = visitDate;
  if (treatmentCost) patch.treatmentCost = treatmentCost;
  if (diagnosis) patch.diagnosis = diagnosis;
  return patch;
}
