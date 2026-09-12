import Icon from '../components/icons';
import { useApply } from './ApplyContext';
import { STEPS } from './steps';
import { DONE_STEP } from './state';

type Status = 'done' | 'active' | 'todo';

export default function ApplyProgress() {
  const { state, dispatch, submitting } = useApply();
  // 접수 완료(6)는 종착이라 완료 단계를 눌러도 돌아가지 않는다. 버튼으로 그리지 않는다.
  // 전송 중에도 잠근다 — 떠나면 접수는 되는데 접수번호를 못 본다 (SSH-486)
  const locked = state.step === DONE_STEP || submitting;
  return (
    <ol className="apply-progress" aria-label="신청 단계">
      {STEPS.map((step, i) => {
        const status: Status =
          step.number < state.step ? 'done' : step.number === state.step ? 'active' : 'todo';
        return (
          <li key={step.key} className={`apply-step ${status}`} aria-current={status === 'active' ? 'step' : undefined}>
            {i > 0 && <span className="apply-step-line" aria-hidden="true" />}
            {status === 'done' && !locked ? (
              <button
                type="button"
                className="apply-step-node"
                onClick={() => dispatch({ type: 'goto', step: step.number })}
                aria-label={`${step.number}단계 ${step.label}로 돌아가기`}
              >
                <span className="apply-step-circle"><Icon name="check" size={13} strokeWidth={3} /></span>
                <span className="apply-step-label">{step.label}</span>
              </button>
            ) : (
              <span className="apply-step-node">
                {/* 접수 완료(잠금)에서는 완료 단계를 버튼 없이 체크로만 그린다 — Figma S6 (SSH-486) */}
                <span className="apply-step-circle">
                  {status === 'done' ? <Icon name="check" size={13} strokeWidth={3} /> : step.number}
                </span>
                <span className="apply-step-label">{step.label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
