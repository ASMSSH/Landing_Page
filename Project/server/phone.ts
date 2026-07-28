// 전화번호 형식 검증/정규화 공통 유틸 — 서버 전용.

export const MOBILE_RE = /^01[016789]\d{7,8}$/;

/** 숫자만 남기고 형식을 검증한다. 올바르지 않으면 빈 문자열을 반환. */
export function normalizePhone(value: string): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return MOBILE_RE.test(digits) ? digits : '';
}
