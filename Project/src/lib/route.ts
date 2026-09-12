// 라우터 없이 pathname으로 페이지를 가른다. 페이지는 랜딩(/)과 대리청구 신청(/apply) 둘뿐이다.
export const APPLY_PATH = '/apply';

export function isApplyPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === APPLY_PATH;
}

/**
 * 랜딩 CTA가 가리킬 /apply 링크. 유입 코드(`/?r=instagram`의 `instagram`)가 있으면 `/apply?r=instagram`.
 * 링크 자체에 코드를 실어야 새 탭·URL 복사·공유에서도 코드가 살아남는다 — sessionStorage(analytics.ts#getRefCode)는
 * 같은 탭 안에서만 유지된다 (SSH-545). 코드는 호출자가 `getRefCode()`로 넘긴다: 이 파일이 analytics.ts를 import하면
 * 모듈 최상단의 import.meta.env·sessionStorage 때문에 node:test(route.test.ts)에서 로드가 안 된다.
 */
export function applyHref(refCode: string | null): string {
  const code = refCode?.trim();
  return code ? `${APPLY_PATH}?r=${encodeURIComponent(code)}` : APPLY_PATH;
}
