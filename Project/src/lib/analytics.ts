import { refCodeFromSearch } from './route';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ENDPOINT =
  SUPABASE_URL && SUPABASE_KEY ? `${SUPABASE_URL}/rest/v1/events` : null;

const MAX_EVENTS_PER_SESSION = 500;
let sentCount = 0;

const SESSION_KEY = 'bgn_session_id';
const VISIT_KEY = 'bgn_visit_count';
const UTM_KEY = 'bgn_utm';
const REF_KEY = 'bgn_ref';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

function getVisitNumber(): number {
  try {
    if (!sessionStorage.getItem('bgn_visit_counted')) {
      sessionStorage.setItem('bgn_visit_counted', '1');
      const n = Number(localStorage.getItem(VISIT_KEY) ?? '0') + 1;
      localStorage.setItem(VISIT_KEY, String(n));
      return n;
    }
    return Number(localStorage.getItem(VISIT_KEY) ?? '1');
  } catch {
    return 0;
  }
}

// getRefCode와 같은 규칙: 지금 URL에 utm_*이 하나라도 있으면 그것으로 덮어쓰고, 없으면 세션에 저장된 값을 쓴다
function getUtm(): Record<string, string> {
  try {
    const params = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 100);
    }
    if (Object.keys(utm).length === 0) {
      const stored = sessionStorage.getItem(UTM_KEY);
      if (stored) return JSON.parse(stored);
    }
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  } catch {
    return {};
  }
}

/**
 * 유입 코드. ?r= 없으면 utm_source (route.ts#refCodeFromSearch, SSH-545).
 * 지금 URL에 코드가 있으면 그것이 이기고 sessionStorage에 덮어쓴다 — 코드 없는 페이지(/apply 내부 이동 등)에서는 저장된 값을 쓴다.
 * 처음엔 "첫 진입 값을 세션 동안 고정"이었는데, 같은 탭에서 코드 없이 한 번 열었다가 나중에 코드 링크로 들어오면
 * 빈 값이 굳어 CTA·신청에 코드가 안 붙었다(2026-09-13 프리뷰 확인). 같은 탭에서 코드가 바뀌면 마지막 코드가 남는다.
 */
export function getRefCode(): string | null {
  try {
    const fromUrl = refCodeFromSearch(location.search);
    if (fromUrl) {
      sessionStorage.setItem(REF_KEY, fromUrl);
      return fromUrl;
    }
    const stored = sessionStorage.getItem(REF_KEY);
    if (stored !== null) return stored || null;
    sessionStorage.setItem(REF_KEY, '');
    return null;
  } catch {
    return null;
  }
}

function send(row: Record<string, unknown>): void {
  if (!ENDPOINT || sentCount >= MAX_EVENTS_PER_SESSION) return;
  sentCount += 1;
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch {
    void 0;
  }
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  const utm = getUtm();
  send({
    event,
    props: { ...props, ...(utm.utm_term && { utm_term: utm.utm_term }), ...(utm.utm_content && { utm_content: utm.utm_content }) },
    session_id: getSessionId(),
    ref_code: getRefCode(),
    referrer: document.referrer.slice(0, 500) || null,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    device: matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
  });
}

let maxScrollPercent = 0;
let activeMs = 0;
let visibleSince: number | null = null;
let leaveSent = false;

function trackPageView(): void {
  const visitNumber = getVisitNumber();
  track('page_view', {
    url: location.href.slice(0, 500),
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
    lang: navigator.language,
    visit_number: visitNumber,
    is_returning: visitNumber > 1,
  });
}

function initScrollDepth(): void {
  const milestones = [25, 50, 75, 100];
  const hit = new Set<number>();
  let ticking = false;
  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const percent = Math.min(
          100,
          Math.round(((scrollY + innerHeight) / doc.scrollHeight) * 100),
        );
        if (percent > maxScrollPercent) maxScrollPercent = percent;
        for (const m of milestones) {
          if (percent >= m && !hit.has(m)) {
            hit.add(m);
            track('scroll_depth', { percent: m });
          }
        }
      });
    },
    { passive: true },
  );
}

function initPageLeave(): void {
  visibleSince = document.visibilityState === 'visible' ? performance.now() : null;

  const onHidden = () => {
    if (visibleSince != null) {
      activeMs += performance.now() - visibleSince;
      visibleSince = null;
    }
    if (!leaveSent) {
      leaveSent = true;
      track('page_leave', {
        seconds_active: Math.round(activeMs / 1000),
        max_scroll_percent: maxScrollPercent,
      });
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHidden();
    else {
      visibleSince = performance.now();
      leaveSent = false;
    }
  });
  addEventListener('pagehide', onHidden);
}

function initClickCapture(): void {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('a, button, summary, input, select, textarea, label');
      if (!el) return;

      const tag = el.tagName.toLowerCase();
      const props: Record<string, unknown> = { tag };

      if (el instanceof HTMLInputElement) {
        props.input_type = el.type;
        if (el.type === 'checkbox') props.checked = el.checked;
      } else {
        const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (text) props.text = text.slice(0, 80);
      }
      if (el instanceof HTMLAnchorElement && el.getAttribute('href')) {
        props.href = el.getAttribute('href')!.slice(0, 300);
      }

      const section = el.closest('section[id]');
      props.section = section
        ? section.id
        : el.closest('header')
            ? 'nav'
            : el.closest('footer')
              ? 'footer'
              : null;

      track('click', props);
    },
    { capture: true, passive: true },
  );
}

function initErrorCapture(): void {
  let errorCount = 0;
  const report = (message: string, extra: Record<string, unknown> = {}) => {
    if (errorCount >= 10) return;
    errorCount += 1;
    track('js_error', { message: message.slice(0, 300), ...extra });
  };
  addEventListener('error', (e) =>
    report(e.message ?? 'unknown', { source: (e.filename ?? '').slice(0, 200), line: e.lineno }),
  );
  addEventListener('unhandledrejection', (e) =>
    report(String(e.reason ?? 'unhandled rejection'), { type: 'unhandledrejection' }),
  );
}

export function observeSections(ids: string[]): void {
  if (!ENDPOINT || typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          track('section_view', { section: entry.target.id });
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.3 },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}

export function initAnalytics(): void {
  if (!ENDPOINT) return;
  trackPageView();
  initScrollDepth();
  initPageLeave();
  initClickCapture();
  initErrorCapture();
}
