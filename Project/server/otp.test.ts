import assert from 'node:assert/strict';
import test from 'node:test';
import { hashCode, sendOtp, verifyOtp } from './otp.ts';
import { sign } from './otpToken.ts';

const SECRET = 'test-secret';
const ENV = {
  signingSecret: SECRET,
  solapiApiKey: 'key',
  solapiApiSecret: 'secret',
  solapiSenderNumber: '01000000000',
};

function withMockedFetch<T>(impl: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

function makeChallenge(phone: string, code: string, overrides: Partial<Record<string, unknown>> = {}) {
  const sentAt = Date.now();
  return sign(
    {
      type: 'otp_challenge',
      phone,
      codeHmac: hashCode(phone, code, SECRET),
      expiresAt: sentAt + 5 * 60 * 1000,
      attempts: 0,
      sentAt,
      jti: 'test-jti',
      ...overrides,
    },
    SECRET,
  );
}

test('sendOtp: 잘못된 전화번호 형식은 400을 반환한다', async () => {
  const result = await sendOtp({ phone: '123' }, ENV);
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'invalid_phone');
});

test('sendOtp: signingSecret이 없으면 500을 반환한다', async () => {
  const result = await sendOtp({ phone: '01011112222' }, {});
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'server_not_configured');
});

test('sendOtp: 프로덕션에서는 Solapi 미설정 시 500을 반환한다(fail-closed)', async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = await sendOtp({ phone: '01011113333' }, { signingSecret: SECRET });
    assert.equal(result.status, 500);
    assert.equal(result.body.error, 'server_not_configured');
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('sendOtp: 개발 환경에서는 Solapi 미설정이어도 콘솔 로그로 발송을 대체한다', async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    const result = await sendOtp({ phone: '01011114444' }, { signingSecret: SECRET });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(typeof result.body.token, 'string');
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('sendOtp: Solapi 발송 성공 시 토큰을 발급한다', async () => {
  await withMockedFetch(
    async () => new Response(JSON.stringify({}), { status: 200 }),
    async () => {
      const result = await sendOtp({ phone: '01033334444' }, ENV);
      assert.equal(result.status, 200);
      assert.equal(result.body.ok, true);
      assert.equal(typeof result.body.token, 'string');
    },
  );
});

test('sendOtp: Solapi 발송 실패 시 502를 반환하고 토큰을 내려주지 않는다', async () => {
  await withMockedFetch(
    async () => new Response(JSON.stringify({}), { status: 500 }),
    async () => {
      const result = await sendOtp({ phone: '01055556666' }, ENV);
      assert.equal(result.status, 502);
      assert.equal(result.body.error, 'sms_send_failed');
      assert.equal(result.body.token, undefined);
    },
  );
});

test('sendOtp: 쿨다운 이내 재요청은 429 resend_too_soon을 반환한다', async () => {
  const phone = '01077778888';
  const previousToken = makeChallenge(phone, '123456', { sentAt: Date.now() });
  const result = await sendOtp({ phone, previousToken }, ENV);
  assert.equal(result.status, 429);
  assert.equal(result.body.error, 'resend_too_soon');
  assert.equal(typeof result.body.retryAfterMs, 'number');
});

test('verifyOtp: 올바른 코드는 otp_verified 토큰을 발급한다', () => {
  const phone = '01099990000';
  const token = makeChallenge(phone, '654321');
  const result = verifyOtp({ token, code: '654321' }, ENV);
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(typeof result.body.verifiedToken, 'string');
});

test('verifyOtp: 틀린 코드는 시도횟수를 올린 토큰과 함께 invalid_code를 반환한다', () => {
  const phone = '01099991111';
  const token = makeChallenge(phone, '654321');
  const result = verifyOtp({ token, code: '000000' }, ENV);
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'invalid_code');
  assert.equal(result.body.attemptsRemaining, 4);
  assert.equal(typeof result.body.token, 'string');
});

test('verifyOtp: 만료된 토큰은 code_expired를 반환한다', () => {
  const phone = '01099992222';
  const token = makeChallenge(phone, '654321', { expiresAt: Date.now() - 1000 });
  const result = verifyOtp({ token, code: '654321' }, ENV);
  assert.equal(result.status, 410);
  assert.equal(result.body.error, 'code_expired');
});

test('verifyOtp: 시도 횟수를 초과하면 코드 비교 없이 too_many_attempts를 반환한다', () => {
  const phone = '01099993333';
  const token = makeChallenge(phone, '654321', { attempts: 5 });
  const result = verifyOtp({ token, code: '654321' }, ENV);
  assert.equal(result.status, 429);
  assert.equal(result.body.error, 'too_many_attempts');
});
