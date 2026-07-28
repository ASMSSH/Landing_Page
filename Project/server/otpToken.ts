// HMAC 서명 토큰 sign/verify 헬퍼 — 서버 전용, 별도 저장소 없이 상태를 토큰에 실어 나른다.
// Node 내장 crypto만 사용 (새 의존성 없음).

import { createHmac, timingSafeEqual } from 'node:crypto';

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

export function sign<T extends object>(payload: T, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verify<T>(token: string, secret: string): { ok: true; payload: T } | { ok: false } {
  if (typeof token !== 'string' || !token.includes('.')) return { ok: false };
  const [body, sig] = token.split('.');
  if (!body || !sig) return { ok: false };

  const expectedSig = createHmac('sha256', secret).update(body).digest('base64url');
  if (!timingSafeEqualStrings(sig, expectedSig)) {
    return { ok: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}
