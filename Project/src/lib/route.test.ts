import assert from 'node:assert/strict';
import test from 'node:test';
import { applyHref, isApplyPath, refCodeFromSearch } from './route.ts';

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

test('applyHref는 유입 코드가 없으면 /apply 그대로다', () => {
  assert.equal(applyHref(null), '/apply');
  assert.equal(applyHref(''), '/apply');
  assert.equal(applyHref('   '), '/apply');
});

test('applyHref는 유입 코드가 있으면 ?r=를 붙인다', () => {
  assert.equal(applyHref('instagram'), '/apply?r=instagram');
  assert.equal(applyHref('ms-cafe-01'), '/apply?r=ms-cafe-01');
});

test('applyHref는 URL에 못 들어가는 문자를 인코딩한다', () => {
  assert.equal(applyHref('a b'), '/apply?r=a%20b');
  assert.equal(applyHref('a&b=c'), '/apply?r=a%26b%3Dc');
});

test('refCodeFromSearch는 ?r=을 먼저 보고, 없으면 utm_source를 유입 코드로 쓴다', () => {
  assert.equal(refCodeFromSearch('?r=instagram'), 'instagram');
  assert.equal(refCodeFromSearch('?utm_source=picket'), 'picket');
  assert.equal(refCodeFromSearch('?utm_source=picket&r=ms-cafe-01'), 'ms-cafe-01');
  assert.equal(refCodeFromSearch('?r=&utm_source=picket'), 'picket');
});

test('refCodeFromSearch는 코드가 없으면 null이고 32자에서 자른다', () => {
  assert.equal(refCodeFromSearch(''), null);
  assert.equal(refCodeFromSearch('?utm_medium=qr'), null);
  assert.equal(refCodeFromSearch('?r=' + 'x'.repeat(40)), 'x'.repeat(32));
});
