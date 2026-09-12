// /apply S1 진료 정보 필수값 검증. 순수 함수 — node:test로 검증한다 (validateTreatment.test.ts).
// 「다음」을 눌렀을 때만 돌리고, 결과가 비어 있으면 통과다.

import { isRealDate } from './receiptToTreatment.ts';
import type { Treatment } from './state.ts';

export type TreatmentErrors = Partial<Record<keyof Treatment, string>>;

/**
 * 글자 수 상한 — 서버(server/claims.ts#validateClaimInput)와 같은 값. 서버가 400을 내면 S5는 칸 구분 없는 실패 배너만 보여 주므로
 * 여기서 먼저 막아야 사용자가 어느 칸을 줄일지 안다 (SSH-544 AI 리뷰 P2). OCR이 채운 값도 「다음」에서 같이 걸린다.
 */
export const TREATMENT_MAX_LENGTH = { hospitalName: 100, hospitalAddress: 200, diagnosis: 200 } as const;
const tooLong = (value: string, max: number) => value.trim().length > max;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD 형식이고 달력에 있는 날짜인가 */
function isIsoRealDate(value: string): boolean {
  const m = value.match(ISO_DATE);
  return Boolean(m) && isRealDate(Number(m![1]), Number(m![2]), Number(m![3]));
}

/** 오늘 날짜를 로컬 기준 YYYY-MM-DD로. 브라우저의 input[type=date] max에도 쓴다. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param today YYYY-MM-DD. 진료일은 이 날짜를 포함해 그 이전만 허용한다
 *              (진료 당일에 영수증을 올리는 경우가 흔하다 — spec 「1차 리뷰 결정」 6)
 */
export function validateTreatment(t: Treatment, today: string): TreatmentErrors {
  const errors: TreatmentErrors = {};

  if (!t.hospitalName.trim()) errors.hospitalName = '병원 이름을 적어 주세요';
  else if (tooLong(t.hospitalName, TREATMENT_MAX_LENGTH.hospitalName)) errors.hospitalName = `병원 이름은 ${TREATMENT_MAX_LENGTH.hospitalName}자 이내로 적어 주세요`;
  if (tooLong(t.hospitalAddress, TREATMENT_MAX_LENGTH.hospitalAddress)) errors.hospitalAddress = `병원 주소는 ${TREATMENT_MAX_LENGTH.hospitalAddress}자 이내로 적어 주세요`;
  if (tooLong(t.diagnosis, TREATMENT_MAX_LENGTH.diagnosis)) errors.diagnosis = `병명은 ${TREATMENT_MAX_LENGTH.diagnosis}자 이내로 적어 주세요`;

  if (!t.visitDate) errors.visitDate = '진료일을 골라 주세요';
  else if (!isIsoRealDate(t.visitDate)) errors.visitDate = '날짜 형식이 맞지 않아요';
  else if (t.visitDate > today) errors.visitDate = '오늘 이전 날짜만 가능해요';

  const cost = t.treatmentCost.replace(/\D/g, '');
  if (!cost || Number(cost) === 0) errors.treatmentCost = '진료비를 적어 주세요';

  return errors;
}
