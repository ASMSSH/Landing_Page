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
            <a href="#problem">후기</a>
            <a href="#faq">FAQ</a>
            <a href="#signup">문의하기</a>
          </nav>
        </div>
        <div className="divider"></div>
        <p className="copyright">© 2026 보험찾개냥 · 펫보험 청구, 맡기고 잊어버리세요. 반려동물과 보호자를 위한 서비스.</p>
      </div>
    </footer>
  );
}
