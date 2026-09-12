import { getRefCode, track } from '../lib/analytics';
import { applyHref } from '../lib/route';
import { INSTAGRAM_URL } from '../data/links';

// 랜딩 하단 Second CTA — Figma 「Second CTA」 프레임. 사전 알림 신청 폼(SignupCta, 전화번호 인증 + 노션 적재)을 대신한다 (SSH-545).
// 폼은 없고 /apply로 보내는 버튼 하나다 — 신청은 /apply가 받는다. 유입 코드가 있으면 링크에 ?r=를 붙인다(applyHref).
// 섹션 id는 signup → cta (section_view·click 트래킹의 section 값이 바뀐다 — supabase/queries.sql 참고).

export default function ApplyCta() {
  return (
    <section id="cta" className="cta-section">
      <div className="wrap">
        <div className="cta-box">
          <h2>영수증 한 장이면 시작할 수 있어요</h2>
          <p className="sub">병원 서류는 저희가 대신 받고, 보험사 제출까지 챙겨드려요.</p>
          <div className="cta-block">
            <a href={applyHref(getRefCode())} className="btn btn-primary" onClick={() => track('cta_click', { cta: 'cta_apply' })}>
              무료로 청구 맡기기 🐾
            </a>
            <p className="cta-caption">무료 이용 기간 · 로그인 없이 5분 · 신청 후 24시간 안에 연락드려요</p>
          </div>
          <p className="cta-note">
            💬 궁금한 점은 인스타그램{' '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" onClick={() => track('cta_click', { cta: 'cta_insta_dm' })}>
              @boheomgaenyang
            </a>
            {' '}DM으로 편하게 물어보세요
          </p>
        </div>
      </div>
    </section>
  );
}
