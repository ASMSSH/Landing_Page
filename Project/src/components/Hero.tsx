import { useMvp } from '../mvp/MvpContext';

export default function Hero() {
  const { open } = useMvp();
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">🐶 펫보험 청구, 이제 헤매지 않아도 돼요</span>
          <h1>
            복잡한 반려동물 보험금 청구,
            <br />
            챙길 서류를 콕 집어 알려드릴게요.
          </h1>
          <p className="sub">영수증 사진 한 장이면, 가입한 보험사에 맞춰 필요한 서류만 정리해드려요.</p>
          <div className="cta-row">
            <a href="#signup" className="btn btn-primary">사전 신청하기 🐾</a>
            <button className="btn btn-sage" onClick={open}>체험해보기 🐾</button>
          </div>
          <p className="hero-note">✉️ 출시되면 이메일로 딱 한 번만 알려드려요. 스팸 걱정 없어요.</p>
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
            <div className="doc-item"><span className="chk">✓</span><span className="name">진료비 세부내역서</span></div>
            <div className="doc-item"><span className="chk">✓</span><span className="name">진단서 (질병명 기재)</span></div>
            <div className="doc-item"><span className="chk">✓</span><span className="name">진료비 영수증 원본</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
