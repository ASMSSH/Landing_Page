import { getRefCode, track } from '../lib/analytics';
import { applyHref } from '../lib/route';

// 랜딩 Hero — Figma 「Hero Copy」. CTA는 「무료로 청구 맡기기」 하나뿐이다 (체험 모달 버튼은 SSH-545에서 모달과 함께 제거).
// 문안의 「무료 이용 기간」은 /apply 헤더와 같은 표현 — 「베타」는 SSH-553에서 뺐다.

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">🐾 무료 이용 기간 · 병원 서류는 저희가 대신 받아요</span>
          <h1>
            복잡한 펫보험 청구,
            <br />
            이제 저희가 대신 해드릴게요
          </h1>
          <p className="sub">영수증 한 장만 올리면, 서류 준비부터 보험금 청구까지 알아서 끝내드려요.</p>
          <div className="cta-row">
            <a href={applyHref(getRefCode())} className="btn btn-primary" onClick={() => track('cta_click', { cta: 'hero_apply' })}>무료로 청구 맡기기 🐾</a>
          </div>
          <p className="hero-note">🐶 로그인 없이 5분이면 끝나요 · 신청하면 24시간 안에 담당자가 연락드려요</p>
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
