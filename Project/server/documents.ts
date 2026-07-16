// 필요서류(청구 유형별) 조회 핸들러 — 서버 전용 (브라우저에서 import 금지).
// 사전알람(server/notion.ts)과 동일 패턴. Notion "보험사 서류 정리" 데이터소스를
// 청구유형/보험사로 query 해서 화면용 ClaimDocumentGuide 를 만든다.
//
// 사전알람 DB와 필요서류 DB는 서로 다른 데이터소스이므로 env 도 별도로 둔다.
//   - 사전알람:   NOTION_SUBSCRIBE_DATA_SOURCE_ID  (server/notion.ts)
//   - 필요서류:   NOTION_DOCS_DATA_SOURCE_ID  (이 파일)

const NOTION_VERSION = '2025-09-03';

// 프론트 claimType(영문) → Notion '청구유형' select(한글) 매핑.
const CLAIM_TYPE_KO: Record<string, string> = {
  illness: '질병',
  injury: '상해',
  skin: '피부/아토피',
  procedure: '검사/처치',
  surgery: '수술/입원',
  preventive: '예방/검진',
  manual: '수동 확인',
};

export interface DocumentsInput {
  claimType?: string;
  insurer?: string;
}

export interface DocumentsEnv {
  token?: string;
  docsDataSourceId?: string;
}

export interface ResultDoc {
  name: string;
  desc: string;
  tag: string;
  tagKind: 'hospital' | 'self';
}

export interface DocumentDownload {
  name: string;
  url: string;
}

export interface ClaimDocumentGuide {
  claimType: string;
  title: string;
  source: 'notion' | 'fallback';
  hospitalDocs: ResultDoc[];
  selfDocs: ResultDoc[];
  downloads?: DocumentDownload[];
  notes: string[];
  warning?: string;
}

export interface DocumentsResult {
  status: number;
  body: ClaimDocumentGuide | { ok: false; error: string; message?: string };
}

/** "삼성화재 위풍당당" - 회사명("삼성화재") 정규화 (server/notion.ts와 동일 규칙) */
function normalizeInsurer(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('기타')) return '기타';
  return trimmed.split(' ')[0];
}

// Notion rich_text/title 배열 → plain text
type RichText = { plain_text?: string };
function plain(items: RichText[] | undefined): string {
  return (items ?? []).map((x) => x.plain_text ?? '').join('');
}

// 줄바꿈으로 구분된 서류 목록 텍스트 → ResultDoc[]
function toDocs(text: string, tag: string, tagKind: 'hospital' | 'self'): ResultDoc[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ name, desc: '', tag, tagKind }));
}

interface NotionFile {
  name?: string;
  file?: { url?: string };
  external?: { url?: string };
}
interface NotionRow {
  properties?: Record<string, {
    rich_text?: RichText[];
    title?: RichText[];
    select?: { name?: string } | null;
    checkbox?: boolean;
    files?: NotionFile[];
  }>;
}

export async function getClaimDocuments(
  input: DocumentsInput,
  env: DocumentsEnv,
): Promise<DocumentsResult> {
  if (!env.token || !env.docsDataSourceId) {
    return {
      status: 501,
      body: {
        ok: false,
        error: 'documents_not_configured',
        message: 'NOTION_TOKEN / NOTION_DOCS_DATA_SOURCE_ID 미설정',
      },
    };
  }

  const claimTypeEn = (input.claimType ?? '').trim();
  const claimTypeKo = CLAIM_TYPE_KO[claimTypeEn] ?? '';
  const insurer = normalizeInsurer(input.insurer ?? '');

  if (!claimTypeKo) {
    return { status: 400, body: { ok: false, error: 'invalid_claim_type', message: `알 수 없는 청구유형: ${claimTypeEn}` } };
  }

  // 활성화된 행 중, 청구유형이 일치하고, 보험사가 (해당 보험사 || 공통)인 서류.
  const insurerFilters: unknown[] = [{ property: '보험사', select: { equals: '공통' } }];
  if (insurer) insurerFilters.push({ property: '보험사', select: { equals: insurer } });

  const filter = {
    and: [
      { property: '활성화', checkbox: { equals: true } },
      { property: '청구유형', select: { equals: claimTypeKo } },
      { or: insurerFilters },
    ],
  };

  let res: Response;
  try {
    res = await fetch(`https://api.notion.com/v1/data_sources/${env.docsDataSourceId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, page_size: 50 }),
    });
  } catch {
    return { status: 502, body: { ok: false, error: 'notion_unreachable', message: 'Notion 요청 실패' } };
  }

  const data = (await res.json().catch(() => ({}))) as { results?: NotionRow[]; code?: string; message?: string };
  if (!res.ok) {
    return { status: res.status || 502, body: { ok: false, error: data.code || 'notion_error', message: data.message } };
  }

  const rows = data.results ?? [];

  // 보험사 전용 행을 공통 행보다 앞에 두어 우선 노출.
  rows.sort((a, b) => {
    const ai = (a.properties?.['보험사']?.select?.name ?? '') === '공통' ? 1 : 0;
    const bi = (b.properties?.['보험사']?.select?.name ?? '') === '공통' ? 1 : 0;
    return ai - bi;
  });

  const hospitalDocs: ResultDoc[] = [];
  const selfDocs: ResultDoc[] = [];
  const downloads: DocumentDownload[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();

  const pushDoc = (target: ResultDoc[], doc: ResultDoc) => {
    const key = `${doc.tagKind}:${doc.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    target.push(doc);
  };

  for (const row of rows) {
    const p = row.properties ?? {};
    toDocs(plain(p['병원서류']?.rich_text), '병원 발급', 'hospital').forEach((d) => pushDoc(hospitalDocs, d));
    toDocs(plain(p['직접서류']?.rich_text), '보험사 양식', 'self').forEach((d) => pushDoc(selfDocs, d));

    const note = plain(p['주의사항']?.rich_text).trim();
    if (note && !notes.includes(note)) notes.push(note);

    for (const f of p['서류파일']?.files ?? []) {
      const url = f.file?.url ?? f.external?.url;
      if (url && !downloads.some((d) => d.url === url)) {
        downloads.push({ name: f.name ?? '서류 파일', url });
      }
    }
  }

  // 일치하는 서류가 하나도 없으면 프론트가 자체 fallback 을 쓰도록 신호.
  if (hospitalDocs.length === 0 && selfDocs.length === 0) {
    return { status: 404, body: { ok: false, error: 'no_documents', message: '해당 조건의 서류를 찾지 못했어요.' } };
  }

  const insurerLabel = insurer || '공통';
  const guide: ClaimDocumentGuide = {
    claimType: claimTypeEn,
    title: `${insurerLabel} · ${claimTypeKo} 청구 준비 서류`,
    source: 'notion',
    hospitalDocs,
    selfDocs,
    downloads: downloads.length ? downloads : undefined,
    notes: notes.length ? notes : ['최종 서류 요건은 가입 보험사 확인이 필요해요.'],
  };
  return { status: 200, body: guide };
}
