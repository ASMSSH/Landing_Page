import { useApply } from './ApplyContext';
import { STEP_COUNT, stepDef } from './steps';

interface ApplyActionsProps {
  /** 주 버튼 비활성. 각 단계 티켓이 검증 결과로 넘긴다. 셸 기본값은 활성 */
  nextDisabled?: boolean;
  /** 주 버튼 동작. 없으면 다음 단계로 */
  onNext?: () => void;
  /**
   * 있으면 「← 이전」 자리에 이 고스트 버튼을 그린다 (S3 「서류만 확인할게요」, SSH-473 spec 3절).
   * 뒤로 가는 길은 프로그레스 바의 완료 단계 클릭(goto)이 따로 있다.
   */
  secondary?: { label: string; onClick: () => void; disabled?: boolean };
}

export default function ApplyActions({ nextDisabled = false, onNext, secondary }: ApplyActionsProps) {
  const { state, dispatch } = useApply();
  const def = stepDef(state.step);
  if (!def) return null;
  return (
    <div className={`apply-actions${secondary ? ' has-secondary' : ''}`}>
      <span className="apply-step-count">{state.step} / {STEP_COUNT}</span>
      <div className="apply-actions-btns">
        {secondary ? (
          <button type="button" className="btn apply-btn-ghost" disabled={secondary.disabled} onClick={secondary.onClick}>
            {secondary.label}
          </button>
        ) : (
          state.step > 1 && (
            <button type="button" className="btn apply-btn-ghost" onClick={() => dispatch({ type: 'prev' })}>
              ← 이전
            </button>
          )
        )}
        <button
          type="button"
          className="btn btn-primary apply-btn-next"
          disabled={nextDisabled}
          onClick={onNext ?? (() => dispatch({ type: 'next' }))}
        >
          {def.nextLabel}
        </button>
      </div>
    </div>
  );
}
