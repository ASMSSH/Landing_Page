// S4 생년월일 텍스트 입력의 자동 하이픈. 숫자만 받아 YYYY → YYYY-MM → YYYY-MM-DD로 붙인다 (phone.ts#formatMobileNumber와 같은 방식).
// type=date 대신 텍스트인 이유: 모바일 달력에서 20~40년 전 연도를 고르는 게 불편하다 (SSH-486 spec 「배경」).
export function formatBirthInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
