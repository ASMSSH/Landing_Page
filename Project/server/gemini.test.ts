import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeReceipt } from './gemini.ts';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/** Gemini generateContent 응답 모양으로 JSON 문자열을 감싼 가짜 fetch. */
function fetchReturning(json: string): typeof fetch {
  return async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: json }] } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
}

test('분석 응답의 병원 이름·주소를 그대로 돌려준다', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchReturning(
    JSON.stringify({
      docType: '진료비 영수증',
      hospital: ' 개냥동물병원 ',
      address: '서울 마포구 양화로 12',
      date: '2026.09.08',
      diag: '피부염 치료',
      cost: '58,000원',
      surgery: false,
      claimType: 'skin',
      summary: '피부염 진료 영수증이에요.',
      evidence: [],
      warnings: [],
    }),
  );

  try {
    const result = await analyzeReceipt(
      { mimeType: 'image/png', imageBase64: ONE_PIXEL_PNG },
      { apiKey: 'test-key', model: 'test-model' },
    );
    assert.equal(result.status, 200);
    assert.ok('hospital' in result.body);
    assert.equal(result.body.hospital, '개냥동물병원');
    assert.equal(result.body.address, '서울 마포구 양화로 12');
    assert.equal(result.body.cost, '58,000');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('병원 이름·주소가 응답에 없으면 빈 문자열로 채운다', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchReturning(
    JSON.stringify({
      docType: '진료비 영수증',
      date: '',
      diag: '',
      cost: '',
      surgery: false,
      claimType: 'manual',
      summary: '',
      evidence: [],
      warnings: ['흐림'],
    }),
  );

  try {
    const result = await analyzeReceipt(
      { mimeType: 'image/png', imageBase64: ONE_PIXEL_PNG },
      { apiKey: 'test-key', model: 'test-model' },
    );
    assert.equal(result.status, 200);
    assert.ok('hospital' in result.body);
    assert.equal(result.body.hospital, '');
    assert.equal(result.body.address, '');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('외부 분석 요청이 끝나지 않으면 제한 시간 후 종료한다', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => reject(new DOMException('Aborted', 'AbortError')),
        { once: true },
      );
    });

  try {
    const result = await analyzeReceipt(
      { mimeType: 'image/png', imageBase64: ONE_PIXEL_PNG },
      { apiKey: 'test-key', model: 'test-model', requestTimeoutMs: 5 },
    );
    assert.equal(result.status, 504);
    assert.deepEqual(result.body, { error: '문서 분석 시간이 초과되었습니다.' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
