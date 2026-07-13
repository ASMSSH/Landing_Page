// Gemini 문서 분석 핸들러 — 서버 전용 (브라우저에서 import 금지).

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface AnalyzeReceiptInput {
  mimeType?: string;
  imageBase64?: string;
}

export interface GeminiEnv {
  apiKey?: string;
  model?: string;
}

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

export interface AnalyzeReceiptResult {
  status: number;
  body: GeminiAnalysis | { error: string };
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    docType: { type: 'STRING' },
    date: { type: 'STRING' },
    diag: { type: 'STRING' },
    cost: { type: 'STRING' },
    surgery: { type: 'BOOLEAN' },
    claimType: { type: 'STRING' },
    summary: { type: 'STRING' },
    evidence: { type: 'ARRAY', items: { type: 'STRING' } },
    warnings: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'docType',
    'date',
    'diag',
    'cost',
    'surgery',
    'claimType',
    'summary',
    'evidence',
    'warnings',
  ],
};

const PROMPT = `
이 이미지는 반려동물 보험 청구에 사용될 수 있는 동물병원 문서입니다.
이미지에 실제로 보이는 내용만 근거로 다음 정보를 추출하세요.

- docType: "진료비 영수증", "진료비 세부내역서", "진단서/소견서" 중 가장 가까운 값
- date: YYYY.MM.DD 형식. 확인할 수 없으면 빈 문자열
- diag: 병명 또는 진료 내용. 문서에 없으면 빈 문자열
- cost: 총 진료비를 천 단위 쉼표가 있는 숫자로 작성하고 "원"은 제외. 확인할 수 없으면 빈 문자열
- surgery: 수술, 마취 또는 입원 근거가 명확하면 true
- claimType: illness, injury, preventive, skin, procedure, surgery, manual 중 하나
- summary: 사용자에게 보여줄 한 문장 요약
- evidence: 판단 근거가 된 짧은 문구 목록. 개인정보는 포함하지 않음
- warnings: 흐림, 잘림, 식별 불가 등 사용자가 확인해야 할 내용

추측하지 말고 확인할 수 없는 값은 빈 문자열 또는 warnings로 처리하세요.
`;

function normalizeModel(model: string): string {
  return model.trim().replace(/^models\//, '');
}

function decodedByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAnalysis(value: unknown): GeminiAnalysis | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const allowedDocTypes = new Set(['진료비 영수증', '진료비 세부내역서', '진단서/소견서']);
  const allowedClaimTypes = new Set(['illness', 'injury', 'preventive', 'skin', 'procedure', 'surgery', 'manual']);
  const docType = text(data.docType);
  const claimType = text(data.claimType);

  return {
    docType: allowedDocTypes.has(docType) ? docType : '진료비 영수증',
    date: text(data.date),
    diag: text(data.diag),
    cost: text(data.cost).replace(/\s*원$/, ''),
    surgery: data.surgery === true,
    claimType: allowedClaimTypes.has(claimType) ? claimType : 'manual',
    summary: text(data.summary) || '문서 분석을 완료했어요.',
    evidence: strings(data.evidence),
    warnings: strings(data.warnings),
  };
}

export async function analyzeReceipt(
  input: AnalyzeReceiptInput,
  env: GeminiEnv,
): Promise<AnalyzeReceiptResult> {
  if (!env.apiKey || !env.model) {
    return { status: 500, body: { error: '문서 분석 서버 설정이 완료되지 않았습니다.' } };
  }

  const mimeType = (input.mimeType ?? '').toLowerCase();
  const imageBase64 = (input.imageBase64 ?? '').replace(/\s/g, '');
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { status: 415, body: { error: '지원하지 않는 이미지 형식입니다.' } };
  }
  if (!imageBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    return { status: 400, body: { error: '이미지 데이터가 올바르지 않습니다.' } };
  }
  if (decodedByteLength(imageBase64) > MAX_IMAGE_BYTES) {
    return { status: 413, body: { error: '이미지는 4MB 이하로 올려주세요.' } };
  }

  const model = normalizeModel(env.model);
  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: PROMPT },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch {
    return { status: 502, body: { error: '문서 분석 서비스에 연결하지 못했습니다.' } };
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (!response.ok) {
    const status = response.status === 429 ? 429 : 502;
    return {
      status,
      body: { error: status === 429 ? '분석 요청이 많습니다. 잠시 후 다시 시도해 주세요.' : '문서 분석에 실패했습니다.' },
    };
  }

  const raw = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();
  if (!raw) {
    return { status: 502, body: { error: '문서 분석 결과를 받지 못했습니다.' } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
  } catch {
    return { status: 502, body: { error: '문서 분석 결과 형식이 올바르지 않습니다.' } };
  }

  const analysis = normalizeAnalysis(parsed);
  if (!analysis) {
    return { status: 502, body: { error: '문서 분석 결과를 처리하지 못했습니다.' } };
  }
  return { status: 200, body: analysis };
}
