import { useState } from 'react';
import { useMvp } from '../mvp/MvpContext';
import { formatMobileNumber } from '../lib/phone';
import { usePhoneVerification } from '../hooks/usePhoneVerification';
import { OTP_ERROR_MESSAGES, SUBSCRIBE_ERROR_MESSAGES } from '../lib/errorMessages';

const INSURER_OPTIONS = [
  '메리츠화재 펫퍼민트',
  'DB손해보험 펫블리',
  'KB손해보험 금쪽같은 펫보험',
  '삼성화재 위풍당당',
  '현대해상 굿앤굿우리펫',
  '카카오페이손해보험 펫보험',
  '마이브라운 펫보험',
  '기타',
];

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function SignupCta() {
  const { open } = useMvp();
  const [phone, setPhone] = useState('');
  const [insurer, setInsurer] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');
  const { otpStatus, otpError, cooldownRemaining, verifiedToken, sendCode, verifyCode } =
    usePhoneVerification(phone);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, insurer, verifiedToken, source: 'landing-signup' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setErrMsg(SUBSCRIBE_ERROR_MESSAGES[data.error] ?? '신청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setStatus('error');
      setErrMsg('네트워크 오류예요. 잠시 후 다시 시도해 주세요.');
    }
  }

  const done = status === 'done';
  const submitting = status === 'submitting';

  return (
    <section id="signup" style={{ paddingBottom: 90 }}>
      <div className="wrap">
        <div className="mvp-strip">
          <span className="line">결과가 어떻게 나오는지, 먼저 체험해볼까요?</span>
          <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
        </div>
        <div className="signup-box">
          <h2>최근에 반려동물 병원 다녀오셨나요?</h2>
          <p className="sub">그 영수증으로 청구대행을 무료로 먼저 체험해보실 수 있어요. 서류 확인부터 보험사 제출, 보험금 수령까지 저희가 대신 다 해드려요. 전화번호 인증 후 지금 신청해주세요.</p>
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="field-labeled">
              <span className="field-label">전화번호</span>
              <div className="otp-row">
                <input
                  className="field otp-font"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={13}
                  placeholder="010-1234-5678"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatMobileNumber(e.target.value))}
                  disabled={otpStatus === 'verified' || done || submitting}
                />
                {otpStatus === 'verified' ? (
                  <span className="otp-verified-badge">인증 완료 ✓</span>
                ) : (
                  <button
                    type="button"
                    className="otp-btn"
                    onClick={sendCode}
                    disabled={cooldownRemaining > 0 || otpStatus === 'sending' || done || submitting}
                  >
                    {cooldownRemaining > 0
                      ? `재전송 ${cooldownRemaining}초`
                      : otpStatus === 'sending'
                        ? '전송 중…'
                        : otpStatus === 'sent' || otpStatus === 'error'
                          ? '인증번호 재전송 ›'
                          : '인증번호 받기 ›'}
                  </button>
                )}
              </div>
            </div>
            <div className="field-labeled">
              <span className="field-label">인증번호</span>
              <div className="otp-row">
                <input
                  className="field otp-font otp-code-input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={otpStatus !== 'sent'}
                />
                <button
                  type="button"
                  className="otp-btn"
                  onClick={() => verifyCode(code)}
                  disabled={code.length !== 6 || otpStatus !== 'sent'}
                >
                  {otpStatus === 'verifying' ? '확인 중…' : '인증 확인 ›'}
                </button>
              </div>
            </div>
            {otpStatus === 'sent' && !otpError && (
              <p className="otp-info">인증번호를 보냈어요. 문자로 받은 6자리 번호를 입력해주세요.</p>
            )}
            {otpError && <p className="otp-error">{OTP_ERROR_MESSAGES[otpError] ?? '오류가 발생했어요.'}</p>}
            <div className="field-labeled">
              <span className="field-label">가입 보험사</span>
              <div className="field-row">
              <select
                className="field otp-font"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                style={{ color: insurer ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                disabled={done || submitting}
              >
                <option value="">가입 보험사 (선택)</option>
                {INSURER_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              </div>
            </div>
            <div className="signup-consents">
              <label>
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={done || submitting}
                />
                개인정보 수집 및 이용 동의 <b>(필수)</b>
              </label>
            </div>
            <button
              className="signup-submit"
              type="submit"
              disabled={done || submitting || !agreed || otpStatus !== 'verified'}
              style={done ? { background: 'var(--success-500)' } : undefined}
            >
              {done
                ? '신청 완료! 가장 먼저 알려드릴게요 🐾'
                : submitting
                  ? '신청 중…'
                  : '청구대행 사전 체험 신청하기 🐾'}
            </button>
          </form>
          {status === 'error' && (
            <p className="privacy" style={{ color: 'var(--error-500)' }}>⚠️ {errMsg}</p>
          )}
          <p className="privacy">
            🔒 입력하신 정보는 청구대행 안내 용도로만 사용하고 안전하게 보관해요 ·{' '}
            <a
              href="https://app.notion.com/p/39bdbdcebb5e80e6a2ffc34ff1c11a8f?source=copy_link"
              target="_blank"
              rel="noreferrer"
            >
              개인정보 처리방침
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
