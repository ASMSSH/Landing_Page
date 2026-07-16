import { useState } from 'react';
import { useMvp } from '../mvp/MvpContext';
import { INSURERS, insurerLabel } from '../data/insurers';

type Status = 'idle' | 'submitting' | 'done' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: '전화번호 형식을 확인해 주세요. (예: 01012345678)',
  server_not_configured: '서버 설정이 아직 완료되지 않았어요.',
  object_not_found: '연동 대상을 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
};

export default function SignupCta() {
  const { open } = useMvp();
  const [phone, setPhone] = useState('');
  const [insurer, setInsurer] = useState('');
  const [betaOptIn, setBetaOptIn] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, insurer, betaOptIn, source: 'landing-signup' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setErrMsg(ERROR_MESSAGES[data.error] ?? '신청에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setStatus('error');
      setErrMsg('네트워크 오류예요. 잠시 후 다시 시도해 주세요.');
    }
  }

  const done = status === 'done';
  const submitting = status === 'submitting';
  const disabled = done || submitting;

  return (
    <section id="signup" style={{ paddingBottom: 90 }}>
      <div className="wrap">
        <div className="mvp-strip">
          <span className="line">청구가 얼마나 간단한지, 먼저 체험해볼까요?</span>
          <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
        </div>
        <div className="signup-box">
          <h2>출시되면 가장 먼저 알려드릴게요</h2>
          <p className="sub">출시 소식을 놓치지 않게, 연락처와 가입 보험사만 남겨주세요. 준비되는 대로 가장 먼저 연락드릴게요.</p>
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="field-row">
              <input
                className="field"
                type="tel"
                inputMode="tel"
                placeholder="전화번호 (예: 01012345678)"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={disabled}
              />
              <select
                className="field"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                style={{ color: insurer ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                disabled={disabled}
              >
                <option value="">가입 보험사 (선택)</option>
                {INSURERS.map((ins) => (
                  <option key={ins.company} value={ins.company}>{insurerLabel(ins)}</option>
                ))}
              </select>
            </div>

            <label className={`trial-optin${betaOptIn ? ' on' : ''}`}>
              <input
                type="checkbox"
                checked={betaOptIn}
                onChange={(e) => setBetaOptIn(e.target.checked)}
                disabled={disabled}
              />
              <span className="trial-box">✓</span>
              <span className="trial-text">
                <span className="trial-title">🐾 사전 체험(무료 청구 대행)에도 참여할래요 (선택)</span>
                <span className="trial-desc">영수증을 보내주시면 출시 전에 실제 청구를 무료로 대신 해드려요.</span>
              </span>
            </label>

            <button
              className="signup-submit"
              type="submit"
              disabled={disabled}
              style={done ? { background: 'var(--success-500)' } : undefined}
            >
              {done
                ? '신청 완료! 가장 먼저 알려드릴게요 🐾'
                : submitting
                  ? '신청 중…'
                  : '출시 알림 신청하기 🐾'}
            </button>
          </form>
          {status === 'error' && (
            <p className="privacy" style={{ color: 'var(--error-500)' }}>⚠️ {errMsg}</p>
          )}
          <p className="privacy">🔒 입력하신 정보는 출시 알림 용도로만 사용해요 · 사전 체험 신청 시 카카오톡으로 안내드려요</p>
        </div>
      </div>
    </section>
  );
}
