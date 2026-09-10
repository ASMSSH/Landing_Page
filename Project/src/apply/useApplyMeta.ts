import { useEffect } from 'react';

// /apply는 index.html 한 장을 랜딩과 같이 쓰므로 title·canonical·OG를 마운트 때 런타임으로 바꾼다.
// 구글은 JS를 실행해 이 값을 읽지만, 카톡·인스타 링크 미리보기 스크래퍼는 정적 HTML(랜딩 값)을 본다.
// 전용 미리보기가 필요해지면 빌드 시 /apply/index.html 프리렌더로 — SSH-545에서 판단.

const APPLY_META = {
  title: '대리청구 신청 · 보험찾개냥',
  description: '영수증 한 장으로 펫보험 청구를 맡기세요. 베타 기간 무료, 로그인 없이 5분.',
  url: 'https://www.boheomgaenyang.com/apply',
};

type Target = { selector: string; attr: 'content' | 'href' };

const TARGETS: Record<'description' | 'canonical' | 'ogUrl' | 'ogTitle' | 'ogDescription', Target> = {
  description: { selector: 'meta[name="description"]', attr: 'content' },
  canonical: { selector: 'link[rel="canonical"]', attr: 'href' },
  ogUrl: { selector: 'meta[property="og:url"]', attr: 'content' },
  ogTitle: { selector: 'meta[property="og:title"]', attr: 'content' },
  ogDescription: { selector: 'meta[property="og:description"]', attr: 'content' },
};

function swap(target: Target, value: string): () => void {
  const el = document.head.querySelector<HTMLElement>(target.selector);
  if (!el) return () => {};
  const prev = el.getAttribute(target.attr);
  el.setAttribute(target.attr, value);
  return () => {
    if (prev === null) el.removeAttribute(target.attr);
    else el.setAttribute(target.attr, prev);
  };
}

export function useApplyMeta(): void {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = APPLY_META.title;
    const restores = [
      swap(TARGETS.description, APPLY_META.description),
      swap(TARGETS.canonical, APPLY_META.url),
      swap(TARGETS.ogUrl, APPLY_META.url),
      swap(TARGETS.ogTitle, APPLY_META.title),
      swap(TARGETS.ogDescription, APPLY_META.description),
    ];
    return () => {
      document.title = prevTitle;
      restores.forEach((restore) => restore());
    };
  }, []);
}
