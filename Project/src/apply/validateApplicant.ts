// /apply S4 신청 정보 검증. 순수 함수 — node:test로 검증한다 (validateApplicant.test.ts).
// S1(validateTreatment)과 같은 흐름: 「다음」을 눌렀을 때만 돌리고, 결과가 비어 있으면 통과다.

import { isRealDate } from './receiptToTreatment.ts';
import type { Applicant } from './state.ts';

export type ApplicantErrors = Partial<Record<keyof Applicant, string>>;

export const MIN_AGE = 14;
const NAME_MAX = 20;
const PET_NAME_MAX = 20;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MOBILE = /^010-\d{4}-\d{4}$/;

/**
 * today 기준 만 나이. birth·today는 YYYY-MM-DD. 생일 당일에 한 살을 더한다.
 * 형식 검사는 호출자가 먼저 한다 — 여기서는 숫자로만 비교한다.
 */
export function ageOn(birth: string, today: string): number {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

function isIsoRealDate(value: string): boolean {
  const m = value.match(ISO_DATE);
  return Boolean(m) && isRealDate(Number(m![1]), Number(m![2]), Number(m![3]));
}

/** @param today YYYY-MM-DD (validateTreatment#todayIso). 생년월일은 이 날짜 이전이어야 하고 만 14세 이상이어야 한다 */
export function validateApplicant(a: Applicant, today: string): ApplicantErrors {
  const errors: ApplicantErrors = {};

  const name = a.name.trim();
  if (name.length < 2 || name.length > NAME_MAX) errors.name = '이름은 2~20자로 적어 주세요';

  if (!MOBILE.test(a.phone)) errors.phone = '010으로 시작하는 휴대전화 번호를 적어 주세요';

  if (!a.birth) errors.birth = '생년월일을 적어 주세요';
  else if (!isIsoRealDate(a.birth)) errors.birth = 'YYYY-MM-DD 형식으로 적어 주세요';
  else if (a.birth > today) errors.birth = '생년월일을 확인해 주세요';
  else if (ageOn(a.birth, today) < MIN_AGE) errors.birth = '만 14세 이상만 신청할 수 있어요';

  const pet = a.petName.trim();
  if (pet.length < 1 || pet.length > PET_NAME_MAX) errors.petName = '반려동물 이름을 적어 주세요';

  return errors;
}
