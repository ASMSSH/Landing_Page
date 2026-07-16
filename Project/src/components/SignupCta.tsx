import { useState } from 'react';
import { useMvp } from '../mvp/MvpContext';

const INSURER_OPTIONS = [
  '메리츠화재 펫퍼민트',
  'DB손해보험 펫블리',
  'KB손해보험 금쪽같은 펫보험',
  '삼성화재 위풍당당',
  '현대해상 굿앤굿우리펫',
  '카카오페이손해보험 펫보험',
  '마이브라운 펫보험',
  '기타 / 모름',
];

type Status = 'idle' | 'submitting' | 'done' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: '이메일 형식을 확인해 주세요.',
  server_not_configured: '서버 설정이 아직 완료되지 않았어요.',
  object_not_found: '연동 대상을 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
};

export default function SignupCta() {
  const { open } = useMvp();
  const [email, setEmail] = useState('');
  const [insurer, setInsurer] = useState('');
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
        body: JSON.stringify({ email, insurer, source: 'landing-signup' }),
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

  return (
    <section id="signup" style={{ paddingBottom: 90 }}>
      <div className="wrap">
        <div className="mvp-strip">
          <span className="line">결과가 어떻게 나오는지, 먼저 체험해볼까요?</span>
          <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
        </div>
        <div className="signup-box">
          <h2>가장 먼저 써보실래요?</h2>
          <p className="sub">출시되면 제일 먼저 알려드릴게요. 이메일과 가입 보험사만 남겨주시면 준비 끝!</p>
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="field-row">
              <input
                className="field"
                type="email"
                placeholder="이메일 주소"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={done || submitting}
              />
              <select
                className="field"
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
            <button
              className="signup-submit"
              type="submit"
              disabled={done || submitting}
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
          <p className="privacy">
            🔒 입력하신 정보는 출시 알림 용도로만 사용하고 안전하게 보관해요 ·{' '}
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
