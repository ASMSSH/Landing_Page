// 브라우저에서 /api/claim-documents(서버 server/documents.ts)를 부르는 얇은 클라이언트.
// 응답 타입은 서버 ClaimDocumentGuide와 같은 모양이다. 서버 파일을 import하지 않는 이유는
// tsconfig.app.json이 src만 보기 때문이다 (SSH-543 spec 「배경」과 같은 이유). src/data/resultDocs.ts에도
// 같은 타입이 있지만 그 파일은 체험 모달용이라 SSH-545에서 mvp와 함께 지워질 후보다.

import type { ClaimType } from './claimType.ts';

const DOCUMENTS_TIMEOUT_MS = 10_000;

/** 서버가 「해당 조건의 서류 없음」일 때 주는 error 코드 (server/documents.ts) */
export const NO_DOCUMENTS = 'no_documents';
/** 가장 일반적인 유형. 특정 유형 행이 없을 때 이걸로 다시 묻는다 */
const GENERAL_CLAIM_TYPE: ClaimType = 'illness';

export interface ResultDoc {
  name: string;
  desc: string;
  tag: string;
  tagKind: 'hospital' | 'self';
}

/** /api/claim-documents 200 응답. 서버 ClaimDocumentGuide와 1:1. */
export interface ClaimDocumentGuide {
  claimType: string;
  title: string;
  source: 'notion' | 'fallback';
  hospitalDocs: ResultDoc[];
  selfDocs: ResultDoc[];
  downloads?: { name: string; url: string }[];
  notes: string[];
  warning?: string;
}

/**
 * 보험사·청구 유형으로 필요 서류를 조회한다.
 * - 10초 타임아웃과 호출자의 signal을 하나의 AbortController로 합친다
 * - 취소(AbortError)는 그대로 던진다 — 호출자가 무시할 수 있게
 * - 서버 실패는 항상 비-2xx `{ ok:false, error }`다. error 코드를 Error 메시지로 던진다
 *   (400 invalid_claim_type · 404 no_documents · 501 documents_not_configured · 502 notion_unreachable)
 */
export async function fetchClaimDocuments(
  claimType: ClaimType,
  insurer: string,
  signal?: AbortSignal,
): Promise<ClaimDocumentGuide> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, DOCUMENTS_TIMEOUT_MS);

  const params = new URLSearchParams({ claimType, insurer });
  let response: Response;
  try {
    response = await fetch(`/api/claim-documents?${params.toString()}`, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('network_error');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  const data = (await response.json().catch(() => ({}))) as Partial<ClaimDocumentGuide> & { error?: string };
  if (!response.ok) throw new Error(data.error || 'claim_documents_unavailable');
  return {
    claimType: data.claimType || claimType,
    title: data.title || '',
    source: data.source === 'notion' ? 'notion' : 'fallback',
    hospitalDocs: data.hospitalDocs ?? [],
    selfDocs: data.selfDocs ?? [],
    downloads: data.downloads,
    notes: data.notes ?? [],
    warning: data.warning,
  };
}

/**
 * 청구 유형으로 조회하고, 그 유형 행이 없으면(404 no_documents) 같은 보험사의 질병(통원) 서류로 한 번 더 조회한다.
 * 노션 필요서류 DB에 예방/검진 행이 없는 보험사가 있어(2026-09-10 실측: DB·KB·현대·카카오페이·마이브라운), 그대로 두면
 * 보험사 서류가 있는데도 「찾지 못했어요」 카드가 뜬다. 질병 행마저 없거나 다른 오류(501·502·네트워크)면 그대로 던진다.
 */
export async function fetchClaimDocumentsOrGeneral(
  claimType: ClaimType,
  insurer: string,
  signal?: AbortSignal,
): Promise<ClaimDocumentGuide> {
  try {
    return await fetchClaimDocuments(claimType, insurer, signal);
  } catch (error) {
    const noRows = error instanceof Error && error.message === NO_DOCUMENTS;
    if (!noRows || claimType === GENERAL_CLAIM_TYPE) throw error;
    return fetchClaimDocuments(GENERAL_CLAIM_TYPE, insurer, signal);
  }
}
