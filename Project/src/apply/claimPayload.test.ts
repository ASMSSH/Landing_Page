import assert from 'node:assert/strict';
import test from 'node:test';
import { toClaimPayload } from './claimPayload.ts';
import { initialApplyState, type ApplyState } from './state.ts';

const CLIENT_ID = '6f1c2a3e-9b4d-4c5e-8f7a-1b2c3d4e5f60';

const filled: ApplyState = {
  ...initialApplyState,
  step: 5,
  treatment: {
    hospitalName: ' 개냥동물병원 ',
    hospitalAddress: '서울 마포구',
    visitDate: '2026-09-08',
    treatmentCost: '58,000',
    diagnosis: '피부염',
  },
  insurance: { insurer: '삼성화재', productName: '위풍당당 다이렉트' },
  requiredDocs: { insurer: '삼성화재', claimType: 'skin', hospitalIssued: ['진료비 영수증'], selfPrepared: [], fallback: false },
  applicant: { name: '김민석', phone: '010-1234-5678', birth: '1995-03-02', petName: '코코' },
  consents: { terms: true, privacy: true, uniqueId: true, hospital3p: true, insurer3p: true },
};

test('상태를 claims 컬럼 이름(snake_case)으로 옮긴다', () => {
  const p = toClaimPayload(filled, 'insta01', CLIENT_ID);
  assert.deepEqual(p, {
    client_id: CLIENT_ID,
    guardian_name: '김민석',
    guardian_phone: '010-1234-5678',
    guardian_birth: '1995-03-02',
    pet_name: '코코',
    hospital_name: '개냥동물병원',
    hospital_address: '서울 마포구',
    visit_date: '2026-09-08',
    treatment_cost: 58000,
    diagnosis: '피부염',
    insurer: '삼성화재',
    product_name: '위풍당당 다이렉트',
    required_docs: filled.requiredDocs,
    consent_terms: true,
    consent_privacy: true,
    consent_unique_id: true,
    consent_hospital_3p: true,
    consent_insurer_3p: true,
    consent_version: 'consent-v1',
    ref_code: 'insta01',
  });
});

test('선택 칸이 비면 null, 유입 코드 없으면 null, 스냅샷 없으면 null', () => {
  const p = toClaimPayload(
    {
      ...filled,
      treatment: { ...filled.treatment, hospitalAddress: '  ', diagnosis: '' },
      insurance: { insurer: '기타 / 모름', productName: '' },
      requiredDocs: null,
    },
    null,
    CLIENT_ID,
  );
  assert.equal(p.hospital_address, null);
  assert.equal(p.diagnosis, null);
  assert.equal(p.product_name, null);
  assert.equal(p.required_docs, null);
  assert.equal(p.ref_code, null);
});

test('진료비는 숫자만 남겨 정수로, 비어 있으면 0', () => {
  assert.equal(toClaimPayload({ ...filled, treatment: { ...filled.treatment, treatmentCost: '12000원' } }, null, CLIENT_ID).treatment_cost, 12000);
  assert.equal(toClaimPayload({ ...filled, treatment: { ...filled.treatment, treatmentCost: '' } }, null, CLIENT_ID).treatment_cost, 0);
});

test('동의 boolean은 그대로 옮긴다 — 미체크는 false', () => {
  const p = toClaimPayload({ ...filled, consents: { ...filled.consents, uniqueId: false } }, null, CLIENT_ID);
  assert.equal(p.consent_unique_id, false);
  assert.equal(p.consent_terms, true);
});
