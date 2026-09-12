import { getRefCode, track } from '../lib/analytics';
import { INSTAGRAM_URL } from '../data/links';
import { applyHref } from '../lib/route';

interface NavProps {
  /** apply: /apply 페이지용. 앵커를 절대 경로로 바꾸고 CTA 자리에 인스타 DM 링크를 둔다 */
  variant?: 'landing' | 'apply';
}

export default function Nav({ variant = 'landing' }: NavProps) {
  const isApply = variant === 'apply';
  const anchor = (id: string) => (isApply ? `/#${id}` : `#${id}`);
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href={isApply ? '/' : '#top'}>
          <span className="paw">🐾</span>
          <span className="wm">보험찾개냥</span>
        </a>
        <nav className="nav-links">
          <a href={anchor('problem')}>문제</a>
          <a href={anchor('features')}>기능</a>
          <a href={anchor('faq')}>자주 묻는 질문</a>
        </nav>
        {isApply ? (
          <a
            className="nav-help"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('cta_click', { cta: 'nav_insta' })}
          >
            문의 · 인스타 DM
          </a>
        ) : (
          <a href={applyHref(getRefCode())} className="nav-cta" onClick={() => track('cta_click', { cta: 'nav_apply' })}>무료로 청구 맡기기</a>
        )}
      </div>
    </header>
  );
}
