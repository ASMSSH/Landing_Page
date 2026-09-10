import Icon from '../components/icons';
import { useApply } from './ApplyContext';
import { STEPS } from './steps';

type Status = 'done' | 'active' | 'todo';

export default function ApplyProgress() {
  const { state, dispatch } = useApply();
  return (
    <ol className="apply-progress" aria-label="신청 단계">
      {STEPS.map((step, i) => {
        const status: Status =
          step.number < state.step ? 'done' : step.number === state.step ? 'active' : 'todo';
        return (
          <li key={step.key} className={`apply-step ${status}`} aria-current={status === 'active' ? 'step' : undefined}>
            {i > 0 && <span className="apply-step-line" aria-hidden="true" />}
            {status === 'done' ? (
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
                <span className="apply-step-circle">{step.number}</span>
                <span className="apply-step-label">{step.label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
