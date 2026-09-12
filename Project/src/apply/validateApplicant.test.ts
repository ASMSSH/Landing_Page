import assert from 'node:assert/strict';
import test from 'node:test';
import type { Applicant } from './state.ts';
import { ageOn, validateApplicant } from './validateApplicant.ts';

const TODAY = '2026-09-10';
const ok: Applicant = { name: '김민석', phone: '010-1234-5678', birth: '1995-03-02', petName: '코코' };
const withPatch = (patch: Partial<Applicant>) => validateApplicant({ ...ok, ...patch }, TODAY);

test('전부 채우면 통과', () => {
  assert.deepEqual(validateApplicant(ok, TODAY), {});
});

test('이름은 trim 기준 2~20자', () => {
  assert.equal(withPatch({ name: '' }).name, '이름은 2~20자로 적어 주세요');
  assert.equal(withPatch({ name: ' 김 ' }).name, '이름은 2~20자로 적어 주세요');
  assert.equal(withPatch({ name: '가'.repeat(21) }).name, '이름은 2~20자로 적어 주세요');
  assert.equal(withPatch({ name: ' 김민 ' }).name, undefined);
  assert.equal(withPatch({ name: '가'.repeat(20) }).name, undefined);
});

test('휴대전화는 010-XXXX-XXXX만', () => {
  assert.equal(withPatch({ phone: '' }).phone, '010으로 시작하는 휴대전화 번호를 적어 주세요');
  assert.equal(withPatch({ phone: '010-123-4567' }).phone, '010으로 시작하는 휴대전화 번호를 적어 주세요');
  assert.equal(withPatch({ phone: '011-1234-5678' }).phone, '010으로 시작하는 휴대전화 번호를 적어 주세요');
  assert.equal(withPatch({ phone: '01012345678' }).phone, '010으로 시작하는 휴대전화 번호를 적어 주세요');
  assert.equal(withPatch({ phone: '010-0000-0000' }).phone, undefined);
});

test('생년월일 — 빈 값·형식·달력·미래 순으로 걸린다', () => {
  assert.equal(withPatch({ birth: '' }).birth, '생년월일을 적어 주세요');
  assert.equal(withPatch({ birth: '1995-3-2' }).birth, 'YYYY-MM-DD 형식으로 적어 주세요');
  assert.equal(withPatch({ birth: '1995-02-30' }).birth, 'YYYY-MM-DD 형식으로 적어 주세요');
  assert.equal(withPatch({ birth: '2026-09-11' }).birth, '생년월일을 확인해 주세요');
});

test('만 14세 미만은 안 되고, 14번째 생일 당일부터 된다', () => {
  assert.equal(withPatch({ birth: '2012-09-11' }).birth, '만 14세 이상만 신청할 수 있어요');
  assert.equal(withPatch({ birth: '2012-09-10' }).birth, undefined);
  assert.equal(withPatch({ birth: '2015-01-01' }).birth, '만 14세 이상만 신청할 수 있어요');
});

test('ageOn은 생일 전이면 한 살 뺀다', () => {
  assert.equal(ageOn('2000-01-01', '2026-09-10'), 26);
  assert.equal(ageOn('2000-12-31', '2026-09-10'), 25);
  assert.equal(ageOn('2000-09-10', '2026-09-10'), 26);
  assert.equal(ageOn('2000-09-11', '2026-09-10'), 25);
});

test('반려동물 이름은 필수, 20자 이하', () => {
  assert.equal(withPatch({ petName: '  ' }).petName, '반려동물 이름을 적어 주세요');
  assert.equal(withPatch({ petName: '가'.repeat(21) }).petName, '반려동물 이름을 적어 주세요');
  assert.equal(withPatch({ petName: '코' }).petName, undefined);
});

test('오류는 여러 칸에 동시에 붙는다', () => {
  const errors = validateApplicant({ name: '', phone: '', birth: '', petName: '' }, TODAY);
  assert.deepEqual(Object.keys(errors).sort(), ['birth', 'name', 'petName', 'phone']);
});
