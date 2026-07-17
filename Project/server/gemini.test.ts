import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeReceipt } from './gemini.ts';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

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
