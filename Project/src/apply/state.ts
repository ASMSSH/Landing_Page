// /apply 단계 상태와 입력값. useReducer 한 곳에서 관리하고 요약 레일이 이 상태를 읽는다.
// React 의존이 없는 순수 함수라 node:test로 검증한다 (state.test.ts).
//
// 필드 이름은 SSH-544의 Supabase `claims` 컬럼과 1:1이다 (camelCase ↔ snake_case만 다르다).
// S5 「신청하기」가 이 상태를 그대로 POST /api/claims 본문으로 보낼 수 있게 하기 위해서다.

/** 1~5는 프로그레스에 그려지는 단계, 6은 접수 완료(S6). */
export type ApplyStep = 1 | 2 | 3 | 4 | 5 | 6;

export const LAST_INPUT_STEP = 5 as const;
export const DONE_STEP = 6 as const;

export interface Treatment {
  hospitalName: string;
  hospitalAddress: string;
  /** YYYY-MM-DD */
  visitDate: string;
  /** 원 단위 정수. 입력 전엔 빈 문자열 */
  treatmentCost: string;
  diagnosis: string;
}

export interface Insurance {
  insurer: string;
  productName: string;
}

/** S3 필요 서류 룩업 결과 스냅샷. 모양은 SSH-473이 확정한다. */
export interface RequiredDocsSnapshot {
  insurer: string;
  claimType: string;
  hospitalIssued: string[];
  selfPrepared: string[];
  fallback: boolean;
}

export interface Applicant {
  name: string;
  /** 010-XXXX-XXXX */
  phone: string;
  /** YYYY-MM-DD */
  birth: string;
  petName: string;
}

export interface Consents {
  terms: boolean;
  privacy: boolean;
  uniqueId: boolean;
  hospital3p: boolean;
  insurer3p: boolean;
}

export interface ApplyState {
  step: ApplyStep;
  treatment: Treatment;
  insurance: Insurance;
  requiredDocs: RequiredDocsSnapshot | null;
  applicant: Applicant;
  consents: Consents;
  /** S5 제출 성공 시 서버가 준 접수번호 (BGN-YYMMDD-NN) */
  receiptNo: string | null;
  /**
   * S1에서 영수증을 읽어 폼을 채운 적이 있는가. 사진 자체는 저장하지 않지만(위키 ⑪-③) 이 표시는 남겨야
   * 다른 단계에 갔다 돌아왔을 때 업로드 카드가 「읽었어요」 상태로 보인다 — 아니면 실패한 줄 알고 다시 올려
   * 고쳐 둔 값을 OCR이 덮어쓴다. claims 컬럼이 아니라 treatment 밖에 둔다 (SSH-543)
   */
  receiptRead: boolean;
}

export type ApplyAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; step: ApplyStep }
  | { type: 'reset' }
  | { type: 'setTreatment'; patch: Partial<Treatment> }
  | { type: 'setInsurance'; patch: Partial<Insurance> }
  | { type: 'setRequiredDocs'; docs: RequiredDocsSnapshot | null }
  | { type: 'setApplicant'; patch: Partial<Applicant> }
  | { type: 'setConsents'; patch: Partial<Consents> }
  | { type: 'setReceiptNo'; receiptNo: string }
  | { type: 'setReceiptRead'; read: boolean };

export const initialApplyState: ApplyState = {
  step: 1,
  treatment: { hospitalName: '', hospitalAddress: '', visitDate: '', treatmentCost: '', diagnosis: '' },
  insurance: { insurer: '', productName: '' },
  requiredDocs: null,
  applicant: { name: '', phone: '', birth: '', petName: '' },
  consents: { terms: false, privacy: false, uniqueId: false, hospital3p: false, insurer3p: false },
  receiptNo: null,
  receiptRead: false,
};

export function applyReducer(state: ApplyState, action: ApplyAction): ApplyState {
  switch (action.type) {
    case 'next':
      // 5 → 6은 제출 성공 뒤 goto로만 간다. next는 입력 단계 안에서만 움직인다.
      if (state.step >= LAST_INPUT_STEP) return state;
      return { ...state, step: (state.step + 1) as ApplyStep };
    case 'prev':
      if (state.step <= 1 || state.step === DONE_STEP) return state;
      return { ...state, step: (state.step - 1) as ApplyStep };
    case 'goto':
      // 접수 완료(6)는 종착이다. 거기서는 어디로도 못 간다 — 되돌아가 「신청하기」를 또 누르면 중복 접수다.
      // 처음으로 돌아가려면 reset뿐이다.
      if (state.step === DONE_STEP) return state;
      // 6으로 가는 것은 제출 성공 뒤(setReceiptNo 이후)에만 된다.
      if (action.step === DONE_STEP) return state.receiptNo ? { ...state, step: DONE_STEP } : state;
      // 프로그레스 클릭으로 뒤로 돌아가는 건 되고, 앞으로 건너뛰는 건 안 된다.
      if (action.step >= state.step) return state;
      return { ...state, step: action.step };
    case 'reset':
      return initialApplyState;
    case 'setTreatment':
      return { ...state, treatment: { ...state.treatment, ...action.patch } };
    case 'setInsurance':
      return { ...state, insurance: { ...state.insurance, ...action.patch } };
    case 'setRequiredDocs':
      return { ...state, requiredDocs: action.docs };
    case 'setApplicant':
      return { ...state, applicant: { ...state.applicant, ...action.patch } };
    case 'setConsents':
      return { ...state, consents: { ...state.consents, ...action.patch } };
    case 'setReceiptNo':
      return { ...state, receiptNo: action.receiptNo };
    case 'setReceiptRead':
      return { ...state, receiptRead: action.read };
  }
}
