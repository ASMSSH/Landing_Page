// S1 폼 칸의 DOM id와 화면 순서. TreatmentForm(렌더)과 StepTreatment(첫 오류 칸 포커스)가 같이 쓴다.
// 컴포넌트 파일에서 분리한 이유: 컴포넌트와 상수를 한 파일에서 export하면 Fast Refresh 경고가 난다.

import type { Treatment } from '../state';

export const fieldId = (name: keyof Treatment) => `apply-field-${name}`;

/** 「다음」에서 첫 오류 칸으로 포커스할 때 쓰는 화면 순서 */
export const TREATMENT_FIELD_ORDER: (keyof Treatment)[] = [
  'hospitalName',
  'visitDate',
  'treatmentCost',
  'diagnosis',
  'hospitalAddress',
];
