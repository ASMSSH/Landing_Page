// 행동 트래킹 모듈 — Supabase REST에 직접 기록한다.
// publishable key는 클라이언트 노출을 전제로 한 키이며, events 테이블은
// RLS로 insert만 허용되어 있어 조회/수정/삭제는 불가능하다.
// 개인정보(전화번호 등)는 어떤 이벤트에도 담지 않는다.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ENDPOINT =
  SUPABASE_URL && SUPABASE_KEY ? `${SUPABASE_URL}/rest/v1/events` : null;

// 무한 루프·악성 스크립트로 인한 폭주 방지용 세션당 전송 상한.
const MAX_EVENTS_PER_SESSION = 500;
let sentCount = 0;

const SESSION_KEY = 'bgn_session_id';
const VISIT_KEY = 'bgn_visit_count';
const UTM_KEY = 'bgn_utm';

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

/** 세션 시작 시 1회 증가하는 누적 방문 횟수 (재방문 여부 판별용). */
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

/** UTM은 첫 진입(first-touch) 값을 세션 동안 유지한다. */
function getUtm(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored);
    const params = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 100);
    }
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  } catch {
    return {};
  }
}

/** fetch keepalive로 전송해 페이지 이탈 중에도 요청이 살아남게 한다. */
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
    /* 트래킹 실패는 무시 — UX에 영향을 주지 않는다 */
  }
}

/** 이벤트 기록. 모든 이벤트에 세션·유입·기기 정보가 자동으로 붙는다. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  const utm = getUtm();
  send({
    event,
    props: { ...props, ...(utm.utm_term && { utm_term: utm.utm_term }), ...(utm.utm_content && { utm_content: utm.utm_content }) },
    session_id: getSessionId(),
    referrer: document.referrer.slice(0, 500) || null,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    device: matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
  });
}

/* ---------- 페이지 수명주기: 진입 → 스크롤 → 이탈 ---------- */

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

/** 탭 이탈/닫기 시 체류 시간과 최대 스크롤 깊이를 기록한다. */
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
      leaveSent = false; // 다시 돌아왔다 떠나면 새로 기록 (seconds_active는 누적값)
    }
  });
  addEventListener('pagehide', onHidden);
}

/* ---------- 전체 클릭 자동 수집 ---------- */

/** 버튼·링크·입력요소 클릭을 자동 수집한다. 입력값(value)은 절대 담지 않는다. */
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
        : el.closest('.modal')
          ? 'mvp_modal'
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

/* ---------- 에러 수집 ---------- */

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

/* ---------- 섹션 도달률 ---------- */

/** 섹션이 화면에 처음 보일 때 1회씩 기록해 스크롤 도달률을 측정한다. */
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

/** 앱 시작 시 1회 호출 — 페이지뷰, 스크롤, 이탈, 클릭, 에러 트래킹을 모두 시작한다. */
export function initAnalytics(): void {
  if (!ENDPOINT) return;
  trackPageView();
  initScrollDepth();
  initPageLeave();
  initClickCapture();
  initErrorCapture();
}
