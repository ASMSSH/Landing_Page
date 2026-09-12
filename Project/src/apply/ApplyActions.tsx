import { useEffect, useRef, type RefObject } from 'react';
import { useApply } from './ApplyContext';
import { STEP_COUNT, stepDef } from './steps';

// 액션 행의 실제 높이를 <html>의 --apply-bar-h에 쓴다 (SSH-548 AI 리뷰 P3).
// 768 이하 고정 바가 가리는 만큼 푸터·토스트·포커스 스크롤을 올리고, 데스크톱 sticky 행이 포커스된 칸을 덮지 않게
// scroll-padding-bottom을 주는 데 CSS가 이 값을 쓴다. CSS의 상수(72/66/68)는 JS가 돌기 전 폴백이다 —
// 버튼 라벨이 두 줄로 꺾이거나 글꼴을 확대해도 예약 공간이 실측과 같이 간다. 인라인 스타일이라 미디어 쿼리의 :root 값보다 우선한다.
// 각 단계가 자기 ApplyActions를 새로 마운트하므로 단계마다 다시 재고, S6(액션 행 없음)에서는 언마운트되며 값을 지운다.
function usePublishBarHeight(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--apply-bar-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--apply-bar-h');
    };
  }, [ref]);
}

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
  const barRef = useRef<HTMLDivElement>(null);
  usePublishBarHeight(barRef);
  const def = stepDef(state.step);
  if (!def) return null;
  return (
    <div className="apply-actions" ref={barRef}>
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
