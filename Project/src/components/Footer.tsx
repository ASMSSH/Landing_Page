import Icon from './icons';
import { track } from '../lib/analytics';
import { INSTAGRAM_URL } from '../data/links';

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
            <a href="#signup">문의하기</a>
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
        <p className="copyright">© 2026 보험찾개냥 · 펫보험 청구, 맡기고 잊어버리세요. 반려동물과 보호자를 위한 서비스.</p>
      </div>
    </footer>
  );
}
