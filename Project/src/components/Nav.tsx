import { track } from '../lib/analytics';

export default function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top">
          <span className="paw">🐾</span>
          <span className="wm">보험찾개냥</span>
        </a>
        <nav className="nav-links">
          <a href="#problem">문제</a>
          <a href="#features">기능</a>
          <a href="#reviews">후기</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>
        <a href="#signup" className="nav-cta" onClick={() => track('cta_click', { cta: 'nav_signup' })}>사전 신청하기</a>
      </div>
    </header>
  );
}
