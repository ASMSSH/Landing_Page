import type { Fields } from '../mvp/types';

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
  summary: string;
  evidence: string[];
  warnings: string[];
}

const dataUrlToPayload = (dataUrl: string) => {
  const [header = '', data = ''] = dataUrl.split(',');
  const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg';
  return { mimeType, imageBase64: data };
};

export async function analyzeReceiptWithGemini(dataUrl: string): Promise<GeminiFieldResult> {
  const response = await fetch('/api/analyze-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataUrlToPayload(dataUrl)),
  });

  const data = (await response.json()) as Partial<GeminiAnalysis> & { error?: string };
  if (!response.ok) throw new Error(data.error || '문서 분석에 실패했습니다.');

  const docType = data.docType || '진료비 영수증';
  return {
    fields: {
      docType,
      date: data.date || '',
      diag: docType === '진료비 영수증' ? '' : data.diag || '',
      cost: data.cost || '',
    },
    surgery: Boolean(data.surgery),
    summary: data.summary || '문서 분석을 완료했어요.',
    evidence: data.evidence || [],
    warnings: data.warnings || [],
  };
}
