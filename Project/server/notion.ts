// Notion 사전알람 연동 핸들러 (서버 전용 — 브라우저에서 import 금지).
// Vite dev 미들웨어에서 쓰이고, 추후 서버리스/Node 래퍼에서도 그대로 재사용 가능.

// 국내 휴대폰 번호(하이픈 유무 허용). 예: 010-1234-5678, 01012345678
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;
const NOTION_VERSION = '2025-09-03';

export interface SubscribeInput {
  phone?: string;
  insurer?: string;
  betaOptIn?: boolean;
  source?: string;
}

export interface NotionEnv {
  token?: string;
  dataSourceId?: string;
}

export interface SubscribeResult {
  status: number;
  body: { ok: boolean; id?: string; error?: string; message?: string };
}

/** "삼성화재 위풍당당" - 회사명("삼성화재") 정규화 */
export function normalizeInsurer(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('기타')) return '기타';
  return trimmed.split(' ')[0];
}

export async function subscribe(input: SubscribeInput, env: NotionEnv): Promise<SubscribeResult> {
  const phone = (input.phone ?? '').trim();
  if (!PHONE_RE.test(phone)) {
    return { status: 400, body: { ok: false, error: 'invalid_phone', message: '전화번호 형식이 올바르지 않아요.' } };
  }
  if (!env.token || !env.dataSourceId) {
    return { status: 500, body: { ok: false, error: 'server_not_configured', message: 'NOTION_TOKEN / NOTION_SUBSCRIBE_DATA_SOURCE_ID 미설정' } };
  }

  const properties: Record<string, unknown> = {
    전화번호: { title: [{ text: { content: phone } }] },
    상태: { select: { name: '신규' } },
    '사전 체험 동의 여부': { checkbox: Boolean(input.betaOptIn) },
    // 유입경로 속성을 DB에 rich_text로 추가하면 아래 주석을 해제
    // 유입경로: { rich_text: [{ text: { content: input.source || 'landing-signup' } }] },
  };
  const insurer = normalizeInsurer(input.insurer ?? '');
  if (insurer) {
    properties['보험사'] = { select: { name: insurer } };
  }

  let res: Response;
  try {
    res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { type: 'data_source_id', data_source_id: env.dataSourceId },
        properties,
      }),
    });
  } catch {
    return { status: 502, body: { ok: false, error: 'notion_unreachable', message: 'Notion 요청 실패' } };
  }

  const data = (await res.json().catch(() => ({}))) as { object?: string; id?: string; code?: string; message?: string };
  if (res.ok && data.object === 'page') {
    return { status: 200, body: { ok: true, id: data.id } };
  }
  return {
    status: res.status || 502,
    body: { ok: false, error: data.code || 'notion_error', message: data.message },
  };
}
