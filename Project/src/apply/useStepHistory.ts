import { useEffect, useRef, type Dispatch } from 'react';
import type { ApplyAction, ApplyStep } from './state';
import { planStepChange, readEntryStep, resolvePopstate, takeExpectedArrival, toHistoryState } from './stepHistory';

/**
 * /apply 단계 ↔ 브라우저 history 연동 (SSH-547). 규칙은 stepHistory.ts에 순수 함수로 있고 여기서는 history API·popstate만 다룬다.
 *
 * - 마운트: 지금 항목을 `{ applyStep: 1 }`로 덮는다 — 새로고침하면 상태는 1인데 항목엔 옛 단계가 남아 있다
 * - 단계가 오르면 pushState(URL은 그대로), 내리면(「← 이전」·프로그레스·reset) history.go로 항목을 걷는다
 * - popstate: 그 항목의 단계로 goto. 접수 완료(6)에서는 reset 뒤 항목 [1]까지 걷어 빈 1단계에 선다. 앞으로가기·전송 중은 되돌린다
 *
 * `entryRef`는 "지금 history 항목이 가리키는 단계". popstate로 단계를 바꿀 때는 이 값을 먼저 맞춰 두어야
 * 뒤이은 단계 변화 효과가 pushState/go를 또 하지 않는다.
 * `expectedRef`는 우리가 건 `history.go`가 도착할 항목의 단계 큐. `history.go`는 비동기라 도착 popstate가 오기 전에 단계가 또
 * 바뀔 수 있고(「← 이전」 연타), 그 popstate를 사용자의 앞으로가기로 오인해 되돌리면 한 단계 더 내려간다(AI 리뷰 P2).
 * 큐 머리와 맞는 popstate는 항목 단계만 기억하고 규칙을 적용하지 않는다.
 *
 * `dispatch`는 ApplyProvider가 감싼 것이어야 한다 — reset에서 영수증 사진·멱등 키를 같이 지운다.
 * `locked`는 S5 전송 중(submitting). 「← 이전」·프로그레스 잠금과 같은 규칙으로 뒤로가기를 되돌린다.
 */
export function useStepHistory(step: ApplyStep, dispatch: Dispatch<ApplyAction>, locked: boolean): void {
  const entryRef = useRef<ApplyStep>(step);
  const expectedRef = useRef<ApplyStep[]>([]);
  const stepRef = useRef(step);
  const lockedRef = useRef(locked);
  stepRef.current = step;
  lockedRef.current = locked;

  // 마운트 — 새로고침·재진입 뒤에도 현재 항목이 1단계를 가리키게. StrictMode의 이중 실행에도 안전하다(같은 값으로 덮는다)
  useEffect(() => {
    history.replaceState(toHistoryState(stepRef.current), '');
    entryRef.current = stepRef.current;
  }, []);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const entry = readEntryStep(event.state);
      if (entry !== null && takeExpectedArrival(expectedRef.current, entry)) {
        // 우리가 건 go의 도착 — 상태는 이미 그 단계다
        entryRef.current = entry;
        return;
      }
      const plan = resolvePopstate(entry, stepRef.current, lockedRef.current);
      if (plan.entryStep !== undefined) entryRef.current = plan.entryStep;
      if (plan.action) dispatch(plan.action);
      if (plan.go) {
        if (plan.goArrivesAt !== undefined) expectedRef.current.push(plan.goArrivesAt);
        history.go(plan.go);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [dispatch]);

  // 단계가 바뀌었는데 history 항목이 아직 그 단계가 아니면(UI에서 바꾼 것) 따라간다. popstate로 바뀐 경우는 entryRef가 이미 맞아 아무것도 안 한다
  useEffect(() => {
    const plan = planStepChange(entryRef.current, step);
    if (!plan) return;
    entryRef.current = step;
    if (plan.kind === 'push') {
      history.pushState(toHistoryState(step), '');
    } else {
      expectedRef.current.push(step);
      history.go(plan.delta);
    }
  }, [step]);
}
