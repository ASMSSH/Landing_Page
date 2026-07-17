import type { Fields } from '../mvp/types';

export type ClaimType = 'illness' | 'injury' | 'preventive' | 'skin' | 'procedure' | 'surgery' | 'manual';

const includesAny = (text: string, keywords: string[]) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

export function inferClaimType(fields: Fields, surgery: boolean): ClaimType {
  const text = `${fields.docType} ${fields.diag}`;

  if (surgery) return 'surgery';
  if (includesAny(text, ['아토피', '피부', '피부염', '알러지', '알레르기'])) return 'skin';
  if (includesAny(text, ['수술', '절제', '봉합'])) return 'surgery';
  if (includesAny(text, ['상해', '사고', '외상', '골절', '타박', '염좌', '교상', '물림', '추락'])) return 'injury';
  if (includesAny(text, ['예방', '접종', '백신', '건강검진', '검진', '중성화', '미용', '스케일링'])) return 'preventive';
  if (includesAny(text, ['초음파', '혈액', '검사', 'x-ray', 'xray', '엑스레이', 'ct', 'mri', '처치'])) return 'procedure';
  if (text.trim()) return 'illness';
  return 'manual';
}
