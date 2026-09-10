// 브라우저에서 POST /api/claims(서버는 SSH-544 — server/claims.ts + api/claims.ts)를 부르는 얇은 클라이언트.
// 본문은 src/apply/claimPayload.ts#toClaimPayload가 만든다. 이 파일은 요청·응답 계약만 안다.
//
// 계약 (SSH-486 spec 4절):
//   성공 200 { ok: true, receipt_no: 'BGN-260910-01' }
//   실패 비-2xx { ok: false, error: string }
// 얇은 래퍼라 테스트하지 않는다 (claimDocuments.fetchClaimDocuments와 같은 취급).

import type { ClaimPayload } from '../apply/claimPayload.ts';

const CLAIMS_TIMEOUT_MS = 15_000;

interface ClaimResponse {
  ok?: boolean;
  receipt_no?: string;
  error?: string;
}

/**
 * 신청을 전송하고 접수번호를 돌려준다.
 * - 15초 타임아웃과 호출자의 signal을 하나의 AbortController로 합친다
 * - 취소(AbortError)는 그대로 던진다 — 호출자가 무시할 수 있게
 * - 네트워크 실패는 'network_error', 서버 실패는 응답의 error 코드(없으면 'claim_submit_failed')를 Error 메시지로 던진다
 */
export async function submitClaim(payload: ClaimPayload, signal?: AbortSignal): Promise<{ receiptNo: string }> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, CLAIMS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('network_error');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  const data = (await response.json().catch(() => ({}))) as ClaimResponse;
  if (!response.ok || data.ok !== true || !data.receipt_no) throw new Error(data.error || 'claim_submit_failed');
  return { receiptNo: data.receipt_no };
}
