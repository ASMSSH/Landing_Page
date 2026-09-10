import { useApply } from './ApplyContext';
import { STEP_COUNT, stepDef } from './steps';

interface ApplyActionsProps {
  /** 주 버튼 비활성. 각 단계 티켓이 검증 결과로 넘긴다. 셸 기본값은 활성 */
  nextDisabled?: boolean;
  /** 주 버튼 동작. 없으면 다음 단계로 */
  onNext?: () => void;
}

export default function ApplyActions({ nextDisabled = false, onNext }: ApplyActionsProps) {
  const { state, dispatch } = useApply();
  const def = stepDef(state.step);
  if (!def) return null;
  return (
    <div className="apply-actions">
      <span className="apply-step-count">{state.step} / {STEP_COUNT}</span>
      <div className="apply-actions-btns">
        {state.step > 1 && (
          <button type="button" className="btn apply-btn-ghost" onClick={() => dispatch({ type: 'prev' })}>
            ← 이전
          </button>
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
