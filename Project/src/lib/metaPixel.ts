// 메타 픽셀(광고 어트리뷰션) 래퍼 — 자체 트래킹(analytics.ts → Supabase events)과 별개 채널이다.
// track() 안에서 이벤트명을 매핑해 몰래 쏘면 자체 이벤트명 변경이 광고 최적화를 조용히 깨뜨리므로
// 호출부(main.tsx·StepConsent.tsx 2곳)가 명시적으로 부른다 (SSH-573 spec 「왜 별도 헬퍼인가」).
// fbq는 index.html의 기본 픽셀 스니펫이 만든다. 없으면(스니펫 로드 실패·광고 차단기) 조용히 무시 —
// 픽셀 때문에 신청 흐름이 막히는 일은 없어야 한다.

declare global {
  interface Window {
    fbq?: (command: 'track' | 'trackCustom', event: string) => void;
  }
}

/** /apply 진입. 커스텀 이벤트 — 완료가 주 5건 미만이면 광고 최적화 기준을 여기로 낮추는 플랜 B용 */
export function pixelStartApplication(): void {
  window.fbq?.('trackCustom', 'StartApplication');
}

/** 청구신청 제출 성공. 메타 표준 이벤트명이라 철자·대소문자 고정 — 광고 캠페인이 이 이름에 최적화를 건다 */
export function pixelSubmitApplication(): void {
  window.fbq?.('track', 'SubmitApplication');
}
