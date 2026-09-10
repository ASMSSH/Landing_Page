// S5 「신청하기」가 POST /api/claims로 보내는 본문. 순수 함수 — node:test로 검증한다 (claimPayload.test.ts).
//
// 키는 SSH-544의 Supabase `claims` 컬럼 이름(snake_case) 그대로다. 서버(server/claims.ts)가 매핑 없이 검증 → 접수번호 →
// insert만 하게 하기 위해서다. `consented_at`은 보내지 않는다 — 클라이언트 시계를 믿지 않고 서버 insert 시각으로 둔다
// (SSH-486 spec 4절).

import { CONSENT_VERSION } from './consents.ts';
import type { ApplyState, RequiredDocsSnapshot } from './state.ts';

export interface ClaimPayload {
  guardian_name: string;
  /** 010-XXXX-XXXX */
  guardian_phone: string;
  /** YYYY-MM-DD */
  guardian_birth: string;
  pet_name: string;
  hospital_name: string;
  hospital_address: string | null;
  /** YYYY-MM-DD */
  visit_date: string;
  /** 원 단위 정수 */
  treatment_cost: number;
  diagnosis: string | null;
  insurer: string;
  product_name: string | null;
  /** S3 스냅샷. S3을 거치지 않았거나 비어 있으면 null */
  required_docs: RequiredDocsSnapshot | null;
  consent_terms: boolean;
  consent_privacy: boolean;
  consent_unique_id: boolean;
  consent_hospital_3p: boolean;
  consent_insurer_3p: boolean;
  /** 동의한 문안 버전 (consents.ts) */
  consent_version: string;
  /** `?r=` 유입 코드 (analytics.ts#getRefCode). 없으면 null */
  ref_code: string | null;
}

/** 선택 칸은 trim해서 비면 null */
const optional = (value: string): string | null => {
  const v = value.trim();
  return v ? v : null;
};

export function toClaimPayload(state: ApplyState, refCode: string | null): ClaimPayload {
  const { treatment, insurance, requiredDocs, applicant, consents } = state;
  return {
    guardian_name: applicant.name.trim(),
    guardian_phone: applicant.phone.trim(),
    guardian_birth: applicant.birth.trim(),
    pet_name: applicant.petName.trim(),
    hospital_name: treatment.hospitalName.trim(),
    hospital_address: optional(treatment.hospitalAddress),
    visit_date: treatment.visitDate,
    treatment_cost: Number(treatment.treatmentCost.replace(/\D/g, '') || 0),
    diagnosis: optional(treatment.diagnosis),
    insurer: insurance.insurer.trim(),
    product_name: optional(insurance.productName),
    required_docs: requiredDocs,
    consent_terms: consents.terms,
    consent_privacy: consents.privacy,
    consent_unique_id: consents.uniqueId,
    consent_hospital_3p: consents.hospital3p,
    consent_insurer_3p: consents.insurer3p,
    consent_version: CONSENT_VERSION,
    ref_code: refCode,
  };
}
