// S4 폼 칸의 DOM id와 화면 순서. ApplicantForm(렌더)과 StepApplicant(첫 오류 칸 포커스)가 같이 쓴다.
// treatmentFields.ts와 같은 이유로 컴포넌트 파일에서 분리했다 (Fast Refresh 경고).

import type { Applicant } from '../state';

export const fieldId = (name: keyof Applicant) => `apply-applicant-${name}`;

/** 「다음」에서 첫 오류 칸으로 포커스할 때 쓰는 화면 순서 */
export const APPLICANT_FIELD_ORDER: (keyof Applicant)[] = ['name', 'phone', 'birth', 'petName'];
