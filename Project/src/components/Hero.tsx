import { useMvp } from '../mvp/MvpContext';
import { track } from '../lib/analytics';

export default function Hero() {
  const { open } = useMvp();
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">🐾 출시 준비 중 — 사전 알림 신청받아요</span>
          <h1>
            복잡한 펫보험 청구,
            <br />
            이제 저희가 대신 해드릴게요
          </h1>
          <p className="sub">영수증 한 장만 올리면, 서류 준비부터 보험금 청구까지 알아서 끝내드려요.</p>
          <div className="cta-row">
            <a href="#signup" className="btn btn-primary" onClick={() => track('cta_click', { cta: 'hero_signup' })}>사전 신청하기 🐾</a>
            <button className="btn btn-sage" onClick={() => { track('cta_click', { cta: 'hero_try' }); open(); }}>체험해보기 🐾</button>
          </div>
          <p className="hero-note">🐶 출시되면 가장 먼저 알려드려요 · 출시 전 청구 대행도 무료로 체험 가능</p>
        </div>

        <div className="app-mock">
          <div className="mock-top">
            <div className="dots">
              <span className="dot on"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <span className="mock-appname">보험찾개냥</span>
          </div>
          <div className="receipt">
            <div className="receipt-title">🧾 진료비 영수증</div>
            <div className="r-row"><span>행복동물병원</span><span>2026.07.02</span></div>
            <div className="r-row"><span>진료·검사비</span><span className="v">184,000원</span></div>
          </div>
          <div className="arrow-down">↓</div>
          <div className="doc-list">
            <div className="doc-item"><span className="chk">✓</span><span className="name">서류 자동 준비 완료</span></div>
            <div className="doc-item"><span className="chk">✓</span><span className="name">가입 보험사에 청구 접수</span></div>
            <div className="doc-item paid">
              <span className="doc-item-left"><span className="chk">✓</span><span className="name">보험금 지급 완료</span></span>
              <span className="paid-amount">128,800원</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
