// /apply 5단계 정의. 프로그레스·단계 헤딩·액션 행이 전부 이 상수를 읽는다.
// 각 단계 본문(S1~S6)은 형제 티켓이 채우고, 여기서는 이름·문구만 둔다.

export type StepNumber = 1 | 2 | 3 | 4 | 5;

export interface StepDef {
  number: StepNumber;
  key: 'treatment' | 'insurance' | 'documents' | 'applicant' | 'consent';
  /** 프로그레스 바 라벨 */
  label: string;
  /** 단계 헤딩 제목 */
  title: string;
  /** 단계 헤딩 아래 한 줄 설명 */
  description: string;
  /** 액션 행 주 버튼 라벨 */
  nextLabel: string;
}

export const STEPS: readonly StepDef[] = [
  {
    number: 1,
    key: 'treatment',
    label: '진료 정보',
    title: '진료 정보 입력하기',
    description: '영수증을 찍으면 병원·진료일·진료비를 읽어 드려요. 없으면 직접 입력해도 돼요',
    nextLabel: '다음 →',
  },
  {
    number: 2,
    key: 'insurance',
    label: '보험 선택',
    title: '보험 선택',
    description: '가입한 보험사를 골라 주세요. 없거나 모르면 「기타 / 모름」',
    nextLabel: '필요 서류 확인 →',
  },
  {
    number: 3,
    key: 'documents',
    label: '필요 서류',
    title: '필요 서류',
    description: '이 청구에 필요한 서류예요. 병원 발급 서류는 저희가 대신 받아드려요',
    nextLabel: '무료로 대신 청구 맡기기 →',
  },
  {
    number: 4,
    key: 'applicant',
    label: '신청 정보',
    title: '신청 정보',
    description: '담당자가 전화로 확인할 수 있게 보호자 정보를 알려 주세요',
    nextLabel: '다음 →',
  },
  {
    number: 5,
    key: 'consent',
    label: '동의',
    title: '동의',
    description: '대리 청구에 필요한 동의 5가지예요. 전문은 「보기」에서 읽을 수 있어요',
    nextLabel: '신청하기',
  },
];

export const STEP_COUNT = STEPS.length;

export function stepDef(step: number): StepDef | undefined {
  return STEPS.find((s) => s.number === step);
}
