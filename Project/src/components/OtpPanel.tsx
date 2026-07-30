import type { OtpControls } from '../lib/useOtp';

const MOBILE_RE = /^01[016789]\d{7,8}$/;

interface Props {
  otp: OtpControls;
  phone: string;
  disabled?: boolean;
  disabledHint?: string;
}

export default function OtpPanel({ otp, phone, disabled, disabledHint }: Props) {
  const digits = phone.replace(/\D/g, '');
  const phoneValid = MOBILE_RE.test(digits);

  if (otp.stage === 'verified') {
    return <div className="otp-panel otp-verified">✅ 전화번호 인증 완료</div>;
  }

  return (
    <div className="otp-panel">
      {otp.stage === 'idle' ? (
        <button
          type="button"
          className="otp-btn"
          disabled={!phoneValid || otp.busy || disabled}
          title={disabled ? disabledHint : !phoneValid ? '휴대전화번호를 먼저 입력해 주세요' : undefined}
          onClick={() => otp.request(digits)}
        >
          {otp.busy ? '준비 중…' : '문자로 본인 인증하기 📩'}
        </button>
      ) : (
        <div className="otp-flow">
          <p className="otp-guide">
            <b>{otp.smsNumber}</b> 번호로 인증번호 <b className="otp-code">{otp.code}</b> 를 문자로 보내주세요.
            <br />
            <span className="otp-note">문자 요금 외 비용은 없어요. 3분 안에 보내면 돼요.</span>
          </p>
          {otp.isMobile ? (
            <a className="otp-btn otp-send" href={otp.smsHref}>
              문자 앱 열기 (내용 자동 입력) →
            </a>
          ) : (
            otp.qrCode && (
              <div className="otp-qr">
                <img src={otp.qrCode} alt="인증 문자 발송 QR" width={128} height={128} />
                <span>휴대폰 카메라로 QR을 찍으면 보낼 문자가 자동으로 준비돼요</span>
              </div>
            )
          )}
          <button
            type="button"
            className="otp-btn otp-confirm"
            disabled={otp.busy || disabled}
            onClick={() => otp.verify(digits)}
          >
            {otp.busy ? '확인 중…' : '문자 보냈어요, 인증 확인 ✓'}
          </button>
        </div>
      )}
      {otp.error && <p className="otp-error">⚠️ {otp.error}</p>}
    </div>
  );
}
