import { createHmac, timingSafeEqual } from 'node:crypto';

const MOBILE_RE = /^01[016789]\d{7,8}$/;
const OCTOMO_EXISTS_URL = 'https://api.octoverse.kr/octomo/v1/public/message/exists';
const OCTOMO_QR_URL = 'https://api.octoverse.kr/octomo/v1/public/message/qr-code';
export const OCTOMO_SMS_NUMBER = '16663538';
const CODE_WINDOW_MS = 10 * 60 * 1000;
const LOOKBACK_MINUTES = 10;
const TOKEN_TTL_MS = 30 * 60 * 1000;

export interface OtpEnv {
  octomoApiKey?: string;
  otpSecret?: string;
}

export interface OtpResult {
  status: number;
  body: Record<string, unknown>;
}

function hmacHex(secret: string, ...parts: string[]): string {
  return createHmac('sha256', secret).update(parts.join('|')).digest('hex');
}

function codeForWindow(secret: string, phone: string, windowIndex: number): string {
  const digest = hmacHex(secret, 'otp-code', phone, String(windowIndex));
  return String(parseInt(digest.slice(0, 12), 16) % 1_000_000).padStart(6, '0');
}

function normalizePhone(raw: unknown): string | null {
  const phone = String(raw ?? '').replace(/\D/g, '');
  return MOBILE_RE.test(phone) ? phone : null;
}

async function octomoPost(url: string, apiKey: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Octomo ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

export async function requestOtp(
  input: { phone?: string; wantQr?: boolean },
  env: OtpEnv,
): Promise<OtpResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { status: 400, body: { ok: false, error: 'invalid_phone' } };
  }
  if (!env.octomoApiKey || !env.otpSecret) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }

  const windowIndex = Math.floor(Date.now() / CODE_WINDOW_MS);
  const code = codeForWindow(env.otpSecret, phone, windowIndex);
  const body: Record<string, unknown> = { ok: true, code, smsNumber: OCTOMO_SMS_NUMBER };

  if (input.wantQr) {
    try {
      const res = await octomoPost(OCTOMO_QR_URL, env.octomoApiKey, { text: code });
      const data = (await res.json().catch(() => ({}))) as { qrCode?: string };
      if (res.ok && data.qrCode) body.qrCode = data.qrCode;
    } catch {
      void 0;
    }
  }
  return { status: 200, body };
}

export async function verifyOtp(
  input: { phone?: string },
  env: OtpEnv,
): Promise<OtpResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { status: 400, body: { ok: false, error: 'invalid_phone' } };
  }
  if (!env.octomoApiKey || !env.otpSecret) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }

  const windowIndex = Math.floor(Date.now() / CODE_WINDOW_MS);
  const codes = [codeForWindow(env.otpSecret, phone, windowIndex), codeForWindow(env.otpSecret, phone, windowIndex - 1)];

  for (const code of codes) {
    let res: Response;
    try {
      res = await octomoPost(OCTOMO_EXISTS_URL, env.octomoApiKey, {
        mobileNum: phone,
        text: code,
        withinMinutes: LOOKBACK_MINUTES,
      });
    } catch {
      return { status: 502, body: { ok: false, error: 'octomo_unreachable' } };
    }
    if (res.status === 429) {
      return { status: 429, body: { ok: false, error: 'rate_limited' } };
    }
    const data = (await res.json().catch(() => ({}))) as { exists?: boolean };
    if (res.ok && data.exists) {
      const exp = Date.now() + TOKEN_TTL_MS;
      const token = hmacHex(env.otpSecret, 'otp-token', phone, String(exp));
      return { status: 200, body: { ok: true, token, exp } };
    }
  }
  return { status: 200, body: { ok: false, error: 'not_verified' } };
}

export function isVerified(
  phone: string,
  token: unknown,
  exp: unknown,
  otpSecret: string,
): boolean {
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now()) return false;
  if (typeof token !== 'string' || token.length !== 64) return false;
  const expected = hmacHex(otpSecret, 'otp-token', phone, String(expNum));
  try {
    return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
