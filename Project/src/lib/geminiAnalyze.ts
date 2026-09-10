// 브라우저에서 /api/analyze-receipt(서버 server/gemini.ts)를 부르는 얇은 클라이언트.
// 응답 타입은 서버 GeminiAnalysis와 같은 모양이다. 서버 파일을 import하지 않는 이유는
// tsconfig.app.json이 src만 보기 때문이다 — 두 선언이 어긋나면 server/gemini.test.ts와
// apply/receiptToTreatment.test.ts에서 드러난다 (SSH-543 spec 「배경」).

const ANALYSIS_TIMEOUT_MS = 30_000;

/** /api/analyze-receipt 성공 응답. 서버 GeminiAnalysis와 1:1. */
export interface GeminiAnalysis {
  docType: string;
  /** 영수증 상단의 병원 상호. 못 읽으면 빈 문자열 */
  hospital: string;
  /** 병원 주소 전체. 못 읽으면 빈 문자열 */
  address: string;
  /** 서버 프롬프트 기준 YYYY.MM.DD. 모델이 다른 형식을 줄 수도 있어 receiptToTreatment가 다시 판다 */
  date: string;
  diag: string;
  /** 천 단위 쉼표가 있는 숫자 문자열 ("58,000"). 숫자만 필요하면 receiptToTreatment */
  cost: string;
  surgery: boolean;
  claimType: string;
  summary: string;
  evidence: string[];
  warnings: string[];
}

export const ANALYZE_FAILED_MESSAGE = '영수증을 읽지 못했어요. 직접 입력해 주세요';

const dataUrlToPayload = (dataUrl: string) => {
  const [header = '', data = ''] = dataUrl.split(',');
  const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
  return { mimeType, imageBase64: data };
};

/**
 * dataURL 이미지를 서버로 보내 영수증을 읽는다.
 * - 30초 타임아웃과 호출자의 signal을 하나의 AbortController로 합친다
 * - 취소(AbortError)는 그대로 던진다 — 호출자가 무시할 수 있게
 * - 네트워크 실패·서버 오류는 한국어 메시지 Error로 바꾼다
 */
export async function analyzeReceiptWithGemini(
  dataUrl: string,
  signal?: AbortSignal,
): Promise<GeminiAnalysis> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, ANALYSIS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('/api/analyze-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataUrlToPayload(dataUrl)),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error(ANALYZE_FAILED_MESSAGE);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  const data = (await response.json().catch(() => ({}))) as Partial<GeminiAnalysis> & { error?: string };
  if (!response.ok) throw new Error(data.error || ANALYZE_FAILED_MESSAGE);

  return {
    docType: data.docType || '진료비 영수증',
    hospital: data.hospital || '',
    address: data.address || '',
    date: data.date || '',
    diag: data.diag || '',
    cost: data.cost || '',
    surgery: Boolean(data.surgery),
    claimType: data.claimType || 'manual',
    summary: data.summary || '',
    evidence: data.evidence || [],
    warnings: data.warnings || [],
  };
}
