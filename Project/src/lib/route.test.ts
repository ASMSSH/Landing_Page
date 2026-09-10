import assert from 'node:assert/strict';
import test from 'node:test';
import { isApplyPath } from './route.ts';

test('/apply와 트레일링 슬래시 변형은 신청 페이지다', () => {
  assert.equal(isApplyPath('/apply'), true);
  assert.equal(isApplyPath('/apply/'), true);
  assert.equal(isApplyPath('/apply//'), true);
});

test('랜딩과 비슷한 경로는 신청 페이지가 아니다', () => {
  assert.equal(isApplyPath('/'), false);
  assert.equal(isApplyPath(''), false);
  assert.equal(isApplyPath('/applyx'), false);
  assert.equal(isApplyPath('/apply/x'), false);
  assert.equal(isApplyPath('/Apply'), false);
});
