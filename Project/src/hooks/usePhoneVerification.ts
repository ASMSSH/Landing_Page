import { useCallback, useEffect, useRef, useState } from 'react';

export type OtpStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

export interface UsePhoneVerification {
  otpStatus: OtpStatus;
  otpError: string;
  cooldownRemaining: number;
  verifiedToken: string | null;
  sendCode: () => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  reset: () => void;
}

const RESEND_COOLDOWN_FALLBACK_MS = 60_000;

export function usePhoneVerification(phone: string): UsePhoneVerification {
  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle');
  const [otpError, setOtpError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const challengeTokenRef = useRef<string | null>(null);
  const cooldownDeadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    cooldownDeadlineRef.current = null;
    setCooldownRemaining(0);
  }, []);

  const startCooldown = useCallback((durationMs: number) => {
    cooldownDeadlineRef.current = Date.now() + durationMs;
    setCooldownRemaining(Math.ceil(durationMs / 1000));
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const deadline = cooldownDeadlineRef.current;
      if (deadline === null) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearCooldownTimer();
    }, 1000);
  }, [clearCooldownTimer]);

  const reset = useCallback(() => {
    challengeTokenRef.current = null;
    clearCooldownTimer();
    setOtpStatus('idle');
    setOtpError('');
    setVerifiedToken(null);
  }, [clearCooldownTimer]);

  // 전화번호가 바뀌면 이전 인증/발송 상태는 더 이상 유효하지 않으므로 항상 초기화한다.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => clearCooldownTimer, [clearCooldownTimer]);

  const sendCode = useCallback(async () => {
    if (otpStatus === 'sending' || cooldownRemaining > 0) return;
    setOtpStatus('sending');
    setOtpError('');
    try {
      const res = await fetch('/api/otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, previousToken: challengeTokenRef.current ?? undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        challengeTokenRef.current = data.token;
        setOtpStatus('sent');
        startCooldown(data.resendAfterMs ?? RESEND_COOLDOWN_FALLBACK_MS);
      } else {
        setOtpStatus('error');
        setOtpError(data.error ?? 'sms_send_failed');
        if (typeof data.retryAfterMs === 'number') startCooldown(data.retryAfterMs);
      }
    } catch {
      setOtpStatus('error');
      setOtpError('network_error');
    }
  }, [otpStatus, cooldownRemaining, phone, startCooldown]);

  const verifyCode = useCallback(async (code: string) => {
    if (!challengeTokenRef.current) return;
    setOtpStatus('verifying');
    setOtpError('');
    try {
      const res = await fetch('/api/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: challengeTokenRef.current, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        challengeTokenRef.current = null;
        clearCooldownTimer();
        setVerifiedToken(data.verifiedToken);
        setOtpStatus('verified');
        return;
      }
      if (typeof data.token === 'string') challengeTokenRef.current = data.token;
      setOtpError(data.error ?? 'invalid_code');
      setOtpStatus(data.error === 'code_expired' || data.error === 'too_many_attempts' ? 'error' : 'sent');
    } catch {
      setOtpError('network_error');
      setOtpStatus('sent');
    }
  }, [clearCooldownTimer]);

  return { otpStatus, otpError, cooldownRemaining, verifiedToken, sendCode, verifyCode, reset };
}
