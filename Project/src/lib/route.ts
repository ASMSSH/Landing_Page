// 라우터 없이 pathname으로 페이지를 가른다. 페이지는 랜딩(/)과 대리청구 신청(/apply) 둘뿐이다.
export const APPLY_PATH = '/apply';

export function isApplyPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === APPLY_PATH;
}
