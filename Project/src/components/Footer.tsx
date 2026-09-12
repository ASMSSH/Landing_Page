import Icon from './icons';
import { getRefCode, track } from '../lib/analytics';
import { applyHref } from '../lib/route';
import { INSTAGRAM_URL, PRIVACY_URL } from '../data/links';

// 랜딩 푸터. 넷째 링크는 「문의하기」(#signup 앵커)였는데 사전 알림 섹션이 사라지며 /apply 링크로 바뀌었다 (SSH-545).
// 개인정보 처리방침 링크는 사전 신청 폼 아래에 있었다 — 폼을 지우면 랜딩에서 처리방침으로 가는 길이 없어져 여기로 옮겼다.

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-row">
          <div className="brand">
            <span className="paw">🐾</span>
            <span className="wm">보험찾개냥</span>
          </div>
          <nav className="foot-links">
            <a href="#problem">문제</a>
            <a href="#features">기능</a>
            <a href="#faq">자주 묻는 질문</a>
            <a href={applyHref(getRefCode())} onClick={() => track('cta_click', { cta: 'footer_apply' })}>청구 맡기기</a>
          </nav>
          <a
            className="sns-link"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="보험찾개냥 인스타그램"
            onClick={() => track('cta_click', { cta: 'footer_insta' })}
          >
            <Icon name="instagram" size={22} />
          </a>
        </div>
        <div className="divider"></div>
        <div className="foot-bottom">
          <p className="copyright">© 2026 보험찾개냥 · 펫보험 청구, 맡기고 잊어버리세요. 반려동물과 보호자를 위한 서비스.</p>
          <a className="foot-privacy" href={PRIVACY_URL} target="_blank" rel="noreferrer">개인정보 처리방침</a>
        </div>
      </div>
    </footer>
  );
}
