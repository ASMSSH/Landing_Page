import assert from 'node:assert/strict';
import test from 'node:test';
import { CLAIM_TYPE_LABEL, inferClaimTypeFromText } from './claimType.ts';

test('키워드로 청구 유형을 가른다', () => {
  assert.equal(inferClaimTypeFromText('피부염 치료'), 'skin');
  assert.equal(inferClaimTypeFromText('슬개골 탈구 수술'), 'surgery');
  assert.equal(inferClaimTypeFromText('앞다리 골절'), 'injury');
  assert.equal(inferClaimTypeFromText('종합백신 접종'), 'preventive');
  assert.equal(inferClaimTypeFromText('혈액검사'), 'procedure');
  assert.equal(inferClaimTypeFromText('감기 증상'), 'illness');
});

test('빈 텍스트·공백은 질병(통원)이다 — manual은 나오지 않는다', () => {
  assert.equal(inferClaimTypeFromText(''), 'illness');
  assert.equal(inferClaimTypeFromText('   '), 'illness');
});

test('대소문자를 가리지 않는다', () => {
  assert.equal(inferClaimTypeFromText('X-Ray 촬영'), 'procedure');
  assert.equal(inferClaimTypeFromText('MRI'), 'procedure');
});

test('여러 키워드가 섞이면 피부 → 수술 → 상해 → 예방 → 검사 순으로 앞선 것이 이긴다', () => {
  assert.equal(inferClaimTypeFromText('피부염 수술'), 'skin');
  assert.equal(inferClaimTypeFromText('골절 수술'), 'surgery');
  assert.equal(inferClaimTypeFromText('검진 중 혈액검사'), 'preventive');
});

test('라벨은 유형마다 하나씩 있다', () => {
  const types = ['illness', 'injury', 'preventive', 'skin', 'procedure', 'surgery', 'manual'] as const;
  for (const t of types) assert.ok(CLAIM_TYPE_LABEL[t].length > 0);
});
