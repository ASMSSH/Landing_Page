// 병명·진료 내용 텍스트로 청구 유형을 추정한다. 서버 /api/claim-documents의 claimType 입력과 같은 값이다.
// React·mvp 의존이 없는 순수 함수라 node:test로 검증한다 (claimType.test.ts).

export type ClaimType = 'illness' | 'injury' | 'preventive' | 'skin' | 'procedure' | 'surgery' | 'manual';

/**
 * 화면 표시용 라벨 (S3 헤딩 「삼성화재 · 통원 기준」). 서버가 노션에 넘기는 select 값(질병, 피부/아토피 …)과는 별개다.
 */
export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  illness: '통원',
  injury: '상해',
  skin: '피부',
  procedure: '검사·처치',
  surgery: '수술·입원',
  preventive: '예방·검진',
  manual: '수동 확인',
};

const includesAny = (text: string, keywords: string[]) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

/**
 * 텍스트만으로 청구 유형을 추정한다 — /apply S3이 S1 병명으로 부른다.
 * 빈 텍스트는 가장 일반적인 질병(통원)이다. `manual`은 절대 돌려주지 않는다 — 노션의 「수동 확인」 행은
 * 배상책임 청구 전용이라 일반 통원에 맞지 않는다 (SSH-473 spec 「배경」).
 */
export function inferClaimTypeFromText(text: string): ClaimType {
  if (includesAny(text, ['아토피', '피부', '피부염', '알러지', '알레르기'])) return 'skin';
  if (includesAny(text, ['수술', '절제', '봉합'])) return 'surgery';
  if (includesAny(text, ['상해', '사고', '외상', '골절', '타박', '염좌', '교상', '물림', '추락'])) return 'injury';
  if (includesAny(text, ['예방', '접종', '백신', '건강검진', '검진', '중성화', '미용', '스케일링'])) return 'preventive';
  if (includesAny(text, ['초음파', '혈액', '검사', 'x-ray', 'xray', '엑스레이', 'ct', 'mri', '처치'])) return 'procedure';
  return 'illness';
}

/**
 * 체험 모달(src/mvp)용. 수술 플래그가 우선이고, 텍스트가 비면 기존대로 `manual`이다.
 * 첫 인자는 mvp `Fields`와 구조가 같아 그쪽 코드를 바꾸지 않아도 된다 — mvp는 SSH-545에서 지워진다.
 */
export function inferClaimType(fields: { docType: string; diag: string }, surgery: boolean): ClaimType {
  if (surgery) return 'surgery';
  const text = `${fields.docType} ${fields.diag}`;
  if (!text.trim()) return 'manual';
  return inferClaimTypeFromText(text);
}
