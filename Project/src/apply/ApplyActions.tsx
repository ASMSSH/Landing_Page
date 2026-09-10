import { useApply } from './ApplyContext';
import { STEP_COUNT, stepDef } from './steps';

interface ApplyActionsProps {
  /** 주 버튼 비활성. 각 단계 티켓이 검증 결과로 넘긴다. 셸 기본값은 활성 */
  nextDisabled?: boolean;
  /** 주 버튼 동작. 없으면 다음 단계로 */
  onNext?: () => void;
  /** 주 버튼 라벨 오버라이드. S5가 전송 중에 「전송 중…」을 보여 주는 데 쓴다 (SSH-486). 없으면 steps.ts nextLabel */
  nextLabel?: string;
}

export default function ApplyActions({ nextDisabled = false, onNext, nextLabel }: ApplyActionsProps) {
  const { state, dispatch, submitting } = useApply();
  const def = stepDef(state.step);
  if (!def) return null;
  return (
    <div className="apply-actions">
      <span className="apply-step-count">{state.step} / {STEP_COUNT}</span>
      <div className="apply-actions-btns">
        {state.step > 1 && (
          <button
            type="button"
            className="btn apply-btn-ghost"
            disabled={submitting}
            onClick={() => dispatch({ type: 'prev' })}
          >
            ← 이전
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary apply-btn-next"
          disabled={nextDisabled}
          onClick={onNext ?? (() => dispatch({ type: 'next' }))}
        >
          {nextLabel ?? def.nextLabel}
        </button>
      </div>
    </div>
  );
}
