// 전화번호 SMS 인증(OTP) 로직 — 서버 전용. 별도 저장소 없이 서명된 토큰만으로 상태를 주고받는다.
// 발송(sendOtp)은 Solapi를 통해 실제 문자를 보내고, 검증(verifyOtp)은 토큰에 담긴 코드 해시와 비교한다.

import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { normalizePhone } from './phone.ts';
import { sign, timingSafeEqualStrings, verify } from './otpToken.ts';

const SOLAPI_BASE = 'https://api.solapi.com';
const CODE_TTL_MS = 5 * 60 * 1000;
const VERIFIED_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface SendOtpInput {
  phone?: string;
  previousToken?: string;
}

export interface VerifyOtpInput {
  token?: string;
  code?: string;
}

export interface OtpEnv {
  signingSecret?: string;
  solapiApiKey?: string;
  solapiApiSecret?: string;
  solapiSenderNumber?: string;
  requestTimeoutMs?: number;
}

export interface OtpResult {
  status: number;
  body: Record<string, unknown>;
}

interface ChallengePayload {
  type: 'otp_challenge';
  phone: string;
  codeHmac: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
  jti: string;
}

interface VerifiedPayload {
  type: 'otp_verified';
  phone: string;
  verifiedAt: number;
  expiresAt: number;
  jti: string;
}

export function hashCode(phone: string, code: string, secret: string): string {
  return createHmac('sha256', secret).update(`${phone}:${code}`).digest('base64url');
}

/** subscribe()가 verifiedToken이 주어진 phone에 대해 유효한지 확인할 때 쓰는 게이트. */
export function isPhoneVerified(verifiedToken: string, phone: string, secret: string): boolean {
  const result = verify<VerifiedPayload>(verifiedToken, secret);
  if (!result.ok || result.payload.type !== 'otp_verified') return false;
  if (Date.now() > result.payload.expiresAt) return false;
  return result.payload.phone === phone;
}

// 콜드 스타트 시 초기화되고 인스턴스 간 공유되지 않는 best-effort 가드일 뿐, 보안 경계가 아니다.
// 실제 방어선은 만료 시간(5분)과 Solapi 콘솔의 잔액/발송량 알림이다.
const lastSentAt = new Map<string, number>();

async function sendSolapiSms(phone: string, code: string, env: OtpEnv): Promise<{ ok: boolean }> {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', env.solapiApiSecret!).update(date + salt).digest('hex');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs ?? 10_000);
  try {
    const response = await fetch(`${SOLAPI_BASE}/messages/v4/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `HMAC-SHA256 apiKey=${env.solapiApiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        message: {
          to: phone,
          from: env.solapiSenderNumber,
          text: `[보험찾개냥] 인증번호는 ${code} 입니다. 5분 이내 입력해 주세요.`,
        },
      }),
    });
    if (!response.ok && process.env.NODE_ENV !== 'production') {
      const body = await response.text().catch(() => '');
      console.log(`[otp] Solapi 발송 실패 (${response.status}): ${body}`);
    }
    return { ok: response.ok };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[otp] Solapi 요청 자체가 실패:', error);
    }
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendOtp(input: SendOtpInput, env: OtpEnv): Promise<OtpResult> {
  const phone = normalizePhone(input.phone ?? '');
  if (!phone) {
    return { status: 400, body: { ok: false, error: 'invalid_phone' } };
  }
  if (!env.signingSecret) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const solapiConfigured = Boolean(env.solapiApiKey && env.solapiApiSecret && env.solapiSenderNumber);
  // 프로덕션에서는 Solapi 설정이 반드시 있어야 한다(fail-closed). 개발 환경에서만
  // Solapi 없이도 콘솔 로그로 코드를 확인해 로컬 테스트를 할 수 있게 허용한다.
  if (isProduction && !solapiConfigured) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }

  if (input.previousToken) {
    const previous = verify<ChallengePayload>(input.previousToken, env.signingSecret);
    if (previous.ok && previous.payload.type === 'otp_challenge' && previous.payload.phone === phone) {
      const elapsed = Date.now() - previous.payload.sentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        return {
          status: 429,
          body: { ok: false, error: 'resend_too_soon', retryAfterMs: RESEND_COOLDOWN_MS - elapsed },
        };
      }
    }
  }

  const lastSent = lastSentAt.get(phone);
  if (lastSent !== undefined && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    return {
      status: 429,
      body: { ok: false, error: 'resend_too_soon', retryAfterMs: RESEND_COOLDOWN_MS - (Date.now() - lastSent) },
    };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

  if (solapiConfigured) {
    const sendResult = await sendSolapiSms(phone, code, env);
    if (!sendResult.ok) {
      return { status: 502, body: { ok: false, error: 'sms_send_failed' } };
    }
  }

  if (!isProduction) {
    console.log(
      solapiConfigured
        ? `[otp] ${phone} 인증코드: ${code}`
        : `[otp] (Solapi 미설정 — 개발용 가짜 발송) ${phone} 인증코드: ${code}`,
    );
  }

  const sentAt = Date.now();
  lastSentAt.set(phone, sentAt);

  const challenge: ChallengePayload = {
    type: 'otp_challenge',
    phone,
    codeHmac: hashCode(phone, code, env.signingSecret),
    expiresAt: sentAt + CODE_TTL_MS,
    attempts: 0,
    sentAt,
    jti: randomBytes(8).toString('hex'),
  };

  return {
    status: 200,
    body: {
      ok: true,
      token: sign(challenge, env.signingSecret),
      expiresAt: challenge.expiresAt,
      resendAfterMs: RESEND_COOLDOWN_MS,
    },
  };
}

export function verifyOtp(input: VerifyOtpInput, env: OtpEnv): OtpResult {
  if (!env.signingSecret) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }

  const result = verify<ChallengePayload>(input.token ?? '', env.signingSecret);
  if (!result.ok || result.payload.type !== 'otp_challenge') {
    return { status: 400, body: { ok: false, error: 'invalid_token' } };
  }

  const payload = result.payload;
  if (Date.now() > payload.expiresAt) {
    return { status: 410, body: { ok: false, error: 'code_expired' } };
  }
  if (payload.attempts >= MAX_ATTEMPTS) {
    return { status: 429, body: { ok: false, error: 'too_many_attempts' } };
  }

  const code = (input.code ?? '').trim();
  const expectedHmac = hashCode(payload.phone, code, env.signingSecret);
  if (!timingSafeEqualStrings(expectedHmac, payload.codeHmac)) {
    const attempts = payload.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return { status: 429, body: { ok: false, error: 'too_many_attempts' } };
    }
    const rotated: ChallengePayload = { ...payload, attempts };
    return {
      status: 400,
      body: {
        ok: false,
        error: 'invalid_code',
        token: sign(rotated, env.signingSecret),
        attemptsRemaining: MAX_ATTEMPTS - attempts,
      },
    };
  }

  const verifiedAt = Date.now();
  const verified: VerifiedPayload = {
    type: 'otp_verified',
    phone: payload.phone,
    verifiedAt,
    expiresAt: verifiedAt + VERIFIED_TTL_MS,
    jti: randomBytes(8).toString('hex'),
  };

  return {
    status: 200,
    body: { ok: true, verifiedToken: sign(verified, env.signingSecret), expiresAt: verified.expiresAt },
  };
}
