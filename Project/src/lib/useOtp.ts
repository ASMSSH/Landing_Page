import { useCallback, useState } from 'react';
import { track } from './analytics';

export type OtpStage = 'idle' | 'issued' | 'verified';

const OTP_ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: '휴대전화번호 형식을 확인해 주세요.',
  server_not_configured: '서버 설정이 아직 완료되지 않았어요.',
  not_verified: '아직 인증 문자가 확인되지 않았어요. 문자를 보낸 뒤 잠시 후 다시 눌러주세요.',
  rate_limited: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
  network: '네트워크 오류예요. 잠시 후 다시 시도해 주세요.',
};

const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function useOtp() {
  const [stage, setStage] = useState<OtpStage>('idle');
  const [code, setCode] = useState('');
  const [smsNumber, setSmsNumber] = useState('16663538');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [exp, setExp] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setStage('idle');
    setCode('');
    setQrCode(null);
    setToken(null);
    setExp(null);
    setError('');
    setBusy(false);
  }, []);

  const request = useCallback(async (phone: string) => {
    setBusy(true);
    setError('');
    track('otp_request');
    try {
      const res = await fetch('/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, wantQr: !IS_MOBILE }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setCode(data.code);
        setSmsNumber(data.smsNumber ?? '16663538');
        setQrCode(data.qrCode ?? null);
        setStage('issued');
      } else {
        setError(OTP_ERROR_MESSAGES[data.error] ?? '인증번호 발급에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setError(OTP_ERROR_MESSAGES.network);
    } finally {
      setBusy(false);
    }
  }, []);

  const verify = useCallback(async (phone: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setToken(data.token);
        setExp(data.exp);
        setStage('verified');
        track('otp_verify', { status: 'done' });
      } else {
        setError(OTP_ERROR_MESSAGES[data.error] ?? '인증 확인에 실패했어요. 잠시 후 다시 시도해 주세요.');
        track('otp_verify', { status: 'fail', error: data.error ?? 'unknown' });
      }
    } catch {
      setError(OTP_ERROR_MESSAGES.network);
      track('otp_verify', { status: 'fail', error: 'network' });
    } finally {
      setBusy(false);
    }
  }, []);

  const smsHref = IS_IOS ? `sms:${smsNumber}&body=${code}` : `sms:${smsNumber}?body=${code}`;

  return { stage, code, smsNumber, qrCode, token, exp, error, busy, isMobile: IS_MOBILE, smsHref, request, verify, reset };
}

export type OtpControls = ReturnType<typeof useOtp>;
