import assert from 'node:assert/strict';
import test from 'node:test';
import { sign, verify } from './otpToken.ts';

const SECRET = 'test-secret';

test('sign/verify 라운드트립: 유효한 서명은 원래 payload를 그대로 복원한다', () => {
  const token = sign({ phone: '01012345678', n: 1 }, SECRET);
  const result = verify<{ phone: string; n: number }>(token, SECRET);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.payload, { phone: '01012345678', n: 1 });
  }
});

test('payload 바디가 변조되면 서명 검증에 실패한다', () => {
  const token = sign({ phone: '01012345678' }, SECRET);
  const [, sig] = token.split('.');
  const tamperedBody = Buffer.from(JSON.stringify({ phone: '01099999999' })).toString('base64url');
  const tampered = `${tamperedBody}.${sig}`;
  assert.equal(verify(tampered, SECRET).ok, false);
});

test('서명이 잘리거나 손상되면 검증에 실패한다', () => {
  const token = sign({ phone: '01012345678' }, SECRET);
  const [body] = token.split('.');
  assert.equal(verify(`${body}.deadbeef`, SECRET).ok, false);
  assert.equal(verify(body, SECRET).ok, false);
});

test('다른 시크릿으로 서명된 토큰은 검증에 실패한다', () => {
  const token = sign({ phone: '01012345678' }, SECRET);
  assert.equal(verify(token, 'other-secret').ok, false);
});
