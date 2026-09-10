import assert from 'node:assert/strict';
import test from 'node:test';
import { NO_DOCUMENTS, fetchClaimDocumentsOrGeneral } from './claimDocuments.ts';

// fetch를 스텁해 요청된 claimType별로 응답을 돌려준다. 호출된 claimType을 기록한다.
function stubFetch(responder: (claimType: string) => { status: number; body: unknown }) {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input), 'http://localhost');
    const claimType = url.searchParams.get('claimType') ?? '';
    calls.push(claimType);
    const { status, body } = responder(claimType);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const guide = (claimType: string) => ({
  claimType, title: `t-${claimType}`, source: 'notion', hospitalDocs: [{ name: '진료비 영수증', desc: '', tag: '병원 발급', tagKind: 'hospital' }], selfDocs: [], notes: [],
});

test('그 유형 행이 없으면(404 no_documents) 질병으로 한 번 더 조회한다', async () => {
  const f = stubFetch((ct) => (ct === 'preventive' ? { status: 404, body: { ok: false, error: NO_DOCUMENTS } } : { status: 200, body: guide(ct) }));
  try {
    const g = await fetchClaimDocumentsOrGeneral('preventive', 'DB손해보험');
    assert.equal(g.claimType, 'illness');
    assert.deepEqual(f.calls, ['preventive', 'illness']);
  } finally { f.restore(); }
});

test('처음부터 질병이면 재조회 없이 그대로 던진다', async () => {
  const f = stubFetch(() => ({ status: 404, body: { ok: false, error: NO_DOCUMENTS } }));
  try {
    await assert.rejects(fetchClaimDocumentsOrGeneral('illness', '기타'), /no_documents/);
    assert.deepEqual(f.calls, ['illness']);
  } finally { f.restore(); }
});

test('no_documents가 아닌 오류(501 등)는 재조회하지 않는다', async () => {
  const f = stubFetch(() => ({ status: 501, body: { ok: false, error: 'documents_not_configured' } }));
  try {
    await assert.rejects(fetchClaimDocumentsOrGeneral('skin', '삼성화재'), /documents_not_configured/);
    assert.deepEqual(f.calls, ['skin']);
  } finally { f.restore(); }
});
