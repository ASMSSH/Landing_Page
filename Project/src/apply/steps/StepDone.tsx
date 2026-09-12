import Icon from '../../components/icons';
import { INSTAGRAM_URL } from '../../data/links';
import { track } from '../../lib/analytics';
import { useApply } from '../ApplyContext';

// S6 접수 완료 — Figma S6. 헤딩·ApplyActions 없이 자기 레이아웃이다(프로그레스는 5개 전부 done·잠금, 레일은 그대로).
// 접수번호는 S5 전송 성공 시 서버가 준 값(state.receiptNo).
// 「홈으로」는 랜딩(/)으로 전체 이동한다(2026-09-12 요청, SSH-547). 처음엔 reset으로 빈 1단계를 보여 줬는데, 접수를 마친 사람이
// 갈 곳은 새 신청이 아니라 홈이다. 브라우저 뒤로가기는 reset 뒤 빈 1단계에 선다 — useStepHistory. reset은 그 경로가 쓴다.
// 진행 상태 조회 기능은 없다(위키 ④ — 앱 유도도 없음). 담당자가 문자로 세 번 알린다.

const NEXT_STEPS = [
  { tone: 'primary', title: '담당자 연락', desc: '24시간 안에 전화로 진료 사실과 보험 정보를 확인해요' },
  { tone: 'secondary', title: '병원 사전 확인', desc: '서류 발급 가능 여부와 위임장·인증 필요 여부를 병원에 물어봐요' },
  { tone: 'success', title: '서류 수령', desc: '가까운 팀원이 병원에 방문해 서류를 받아요' },
  { tone: 'success', title: '보험사 청구', desc: '신분증·통장 사본·위임장을 받은 뒤 보험사에 제출하고 알려드려요' },
] as const;

export default function StepDone() {
  const { state } = useApply();
  return (
    <section className="apply-done" aria-labelledby="apply-done-title">
      <div className="apply-done-head">
        <span className="apply-done-icon" aria-hidden="true">
          <Icon name="check" size={28} strokeWidth={3} />
        </span>
        <h2 id="apply-done-title" className="apply-done-title">신청이 접수됐어요</h2>
        <p className="apply-done-sub">담당자가 24시간 안에 전화드릴게요. 병원 확인이 끝나면 문자·카톡으로 알려드려요.</p>
      </div>

      <div className="apply-done-receipt">
        <span className="apply-done-receipt-label">접수번호</span>
        <strong className="apply-done-receipt-no">{state.receiptNo}</strong>
        <span className="apply-done-receipt-hint">문의할 때 이 번호를 알려 주세요</span>
      </div>

      <div className="apply-panel">
        <h3 className="apply-form-title">앞으로의 절차</h3>
        <ol className="apply-done-steps">
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title} className="apply-done-step">
              <span className={`apply-done-step-num tone-${step.tone}`}>{i + 1}</span>
              <div className="apply-done-step-copy">
                <p className="apply-done-step-title">{step.title}</p>
                <p className="apply-done-step-desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <a
        className="btn apply-done-insta"
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() => track('cta_click', { cta: 'apply_done_insta' })}
      >
        <Icon name="instagram" size={18} />
        인스타그램에서 진행 소식 받기
      </a>
      <p className="apply-done-note">
        청구 진행 상황 조회 기능은 아직 없어요. 담당자가 진료 확인·서류 확보·청구 완료 세 번 문자로 알려드려요.
      </p>

      <div className="apply-done-foot">
        <span className="apply-step-count">접수 완료</span>
        <a className="btn apply-btn-ghost" href="/">
          홈으로
        </a>
      </div>
    </section>
  );
}
