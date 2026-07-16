import type { Fields } from '../mvp/types';
import type { ClaimType } from './claimType';

const ANALYSIS_TIMEOUT_MS = 30_000;
const CLAIM_TYPES: ClaimType[] = [
  'illness',
  'injury',
  'preventive',
  'skin',
  'procedure',
  'surgery',
  'manual',
];

export interface GeminiAnalysis {
  docType: string;
  date: string;
  diag: string;
  cost: string;
  surgery: boolean;
  claimType: string;
  summary: string;
  evidence: string[];
  warnings: string[];
}

export interface GeminiFieldResult {
  fields: Fields;
  surgery: boolean;
  claimType: ClaimType;
  summary: string;
  evidence: string[];
  warnings: string[];
}

const dataUrlToPayload = (dataUrl: string) => {
  const [header = '', data = ''] = dataUrl.split(',');
  const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
  return { mimeType, imageBase64: data };
};

export async function analyzeReceiptWithGemini(
  dataUrl: string,
  signal?: AbortSignal,
): Promise<GeminiFieldResult> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, ANALYSIS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('/api/analyze-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataUrlToPayload(dataUrl)),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }

  const data = (await response.json()) as Partial<GeminiAnalysis> & { error?: string };
  if (!response.ok) throw new Error(data.error || '문서 분석에 실패했습니다.');

  const docType = data.docType || '진료비 영수증';
  const claimType = CLAIM_TYPES.includes(data.claimType as ClaimType)
    ? (data.claimType as ClaimType)
    : 'manual';
  return {
    fields: {
      docType,
      date: data.date || '',
      diag: data.diag || '',
      cost: data.cost || '',
    },
    surgery: Boolean(data.surgery),
    claimType,
    summary: data.summary || '문서 분석을 완료했어요.',
    evidence: data.evidence || [],
    warnings: data.warnings || [],
  };
}
