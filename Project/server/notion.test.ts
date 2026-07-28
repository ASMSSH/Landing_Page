import assert from 'node:assert/strict';
import test from 'node:test';
import { subscribe } from './notion.ts';
import { sign } from './otpToken.ts';

const SECRET = 'test-secret';
const PHONE = '01012345678';

function makeVerifiedToken(phone: string, overrides: Partial<Record<string, unknown>> = {}): string {
  const verifiedAt = Date.now();
  return sign(
    {
      type: 'otp_verified',
      phone,
      verifiedAt,
      expiresAt: verifiedAt + 10 * 60 * 1000,
      jti: 'test-jti',
      ...overrides,
    },
    SECRET,
  );
}

test('subscribe: verifiedToken이 없으면 401을 반환하고 Notion에 요청하지 않는다', async () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  try {
    const result = await subscribe(
      { phone: PHONE },
      { token: 'notion-token', dataSourceId: 'ds-id', otpSecret: SECRET },
    );
    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'phone_not_verified');
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('subscribe: verifiedToken의 전화번호가 요청 전화번호와 다르면 401을 반환한다', async () => {
  const token = makeVerifiedToken('01099998888');
  const result = await subscribe(
    { phone: PHONE, verifiedToken: token },
    { token: 'notion-token', dataSourceId: 'ds-id', otpSecret: SECRET },
  );
  assert.equal(result.status, 401);
  assert.equal(result.body.error, 'phone_not_verified');
});

test('subscribe: 유효한 verifiedToken이면 Notion에 페이지를 생성하고 체크박스를 true로 고정한다', async () => {
  const token = makeVerifiedToken(PHONE);
  let capturedBody: { properties?: Record<string, unknown> } | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url, init) => {
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ object: 'page', id: 'page-id' }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await subscribe(
      { phone: PHONE, verifiedToken: token },
      { token: 'notion-token', dataSourceId: 'ds-id', otpSecret: SECRET },
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.deepEqual(capturedBody?.properties?.['사전 체험 동의 여부'], { checkbox: true });
    assert.deepEqual(capturedBody?.properties?.['베타 참여'], { checkbox: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
