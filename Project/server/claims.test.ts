import assert from 'node:assert/strict';
import test from 'node:test';
import { boardUrlFrom, buildClaimMessage, createClaim, maskPhone, nextReceiptNo, receiptPrefix, todayKst, validateClaimInput, type ClaimsEnv } from './claims.ts';

// PR #32 본문에 잡힌 실제 payload + client_id. 클라이언트가 통과시키는 값은 서버도 통과시켜야 한다.
const CLIENT_ID = '6f1c2a3e-9b4d-4c5e-8f7a-1b2c3d4e5f60';
const payload = {
  client_id: CLIENT_ID,
  guardian_name: '김민석',
  guardian_phone: '010-1234-5678',
  guardian_birth: '1995-03-02',
  pet_name: '코코',
  hospital_name: '개냥동물병원',
  hospital_address: null,
  visit_date: '2026-09-08',
  treatment_cost: 58000,
  diagnosis: '피부염',
  insurer: '삼성화재',
  product_name: null,
  required_docs: { insurer: '삼성화재', claimType: 'skin', hospitalIssued: ['진료비 영수증'], selfPrepared: ['신분증 사본'], fallback: false },
  consent_terms: true,
  consent_privacy: true,
  consent_unique_id: true,
  consent_hospital_3p: true,
  consent_insurer_3p: true,
  consent_version: 'consent-v1',
  ref_code: 'test',
};
const TODAY = '2026-09-10';
const NOW = new Date('2026-09-10T03:00:00Z'); // KST 12:00
const ENV = { supabaseUrl: 'https://abcdefgh.supabase.co', secretKey: 'sb_secret_test', slackWebhookUrl: 'https://hooks.slack.com/services/T/B/x' };

// ---------------------------------------------------------------- 순수 함수

test('validateClaimInput — 실제 payload는 통과하고 client_id·필드가 그대로 온다', () => {
  const r = validateClaimInput(payload, TODAY);
  assert.ok(r.ok);
  assert.equal(r.row.client_id, CLIENT_ID);
  assert.equal(r.row.guardian_name, '김민석');
  assert.equal(r.row.treatment_cost, 58000);
  assert.deepEqual(r.row.required_docs, payload.required_docs);
  assert.equal(r.row.ref_code, 'test');
  assert.ok(!('consented_at' in r.row));
  assert.ok(!('receipt_no' in r.row));
});

test('validateClaimInput — client_id 없으면 null, required_docs의 모르는 키는 버린다', () => {
  const { client_id: _omit, ...withoutClientId } = payload;
  const r = validateClaimInput({ ...withoutClientId, required_docs: { ...payload.required_docs, extra: 1 } }, TODAY);
  assert.ok(r.ok);
  assert.equal(r.row.client_id, null);
  assert.ok(!('extra' in (r.row.required_docs as object)));
});

test('validateClaimInput — 필드별 실패', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['body', null as unknown as Record<string, unknown>],
    ['client_id', { client_id: 'not-a-uuid' }],
    ['guardian_name', { guardian_name: '김' }],
    ['guardian_name', { guardian_name: 123 }],
    ['guardian_phone', { guardian_phone: '01012345678' }],
    ['guardian_birth', { guardian_birth: '2015-01-01' }], // 만 14세 미만
    ['guardian_birth', { guardian_birth: '2012-09-11' }], // 생일 하루 전 — 13세
    ['guardian_birth', { guardian_birth: '2027-01-01' }], // 미래
    ['guardian_birth', { guardian_birth: '2000-02-30' }], // 달력에 없음
    ['pet_name', { pet_name: ' ' }],
    ['hospital_name', { hospital_name: '' }],
    ['hospital_address', { hospital_address: 'x'.repeat(201) }],
    ['visit_date', { visit_date: '2026-09-11' }], // 내일
    ['treatment_cost', { treatment_cost: -1 }],
    ['treatment_cost', { treatment_cost: 1.5 }],
    ['treatment_cost', { treatment_cost: '58000' }],
    ['insurer', { insurer: '' }],
    ['required_docs', { required_docs: { ...payload.required_docs, hospitalIssued: 'x' } }],
    ['required_docs', { required_docs: 'skin' }],
    ['consent_privacy', { consent_privacy: false }],
    ['consent_insurer_3p', { consent_insurer_3p: 'true' }],
    ['consent_version', { consent_version: 'v1' }],
    ['ref_code', { ref_code: 'x'.repeat(33) }],
  ];
  for (const [field, patch] of cases) {
    const input = patch === null ? null : { ...payload, ...patch };
    const r = validateClaimInput(input, TODAY);
    assert.ok(!r.ok, `${field} 통과됨`);
    assert.equal(r.field, field, JSON.stringify(patch));
  }
});

test('validateClaimInput — 생일 당일은 14세', () => {
  const r = validateClaimInput({ ...payload, guardian_birth: '2012-09-10' }, TODAY);
  assert.ok(r.ok);
});

test('receiptPrefix·todayKst — KST 자정 경계', () => {
  assert.equal(receiptPrefix(new Date('2026-09-10T14:59:00Z')), 'BGN-260910-');
  assert.equal(receiptPrefix(new Date('2026-09-10T15:00:00Z')), 'BGN-260911-');
  assert.equal(todayKst(new Date('2026-09-10T15:00:00Z')), '2026-09-11');
});

test('nextReceiptNo', () => {
  assert.equal(nextReceiptNo('BGN-260910-', null), 'BGN-260910-01');
  assert.equal(nextReceiptNo('BGN-260910-', 'BGN-260910-01'), 'BGN-260910-02');
  assert.equal(nextReceiptNo('BGN-260910-', 'BGN-260910-09'), 'BGN-260910-10');
  assert.equal(nextReceiptNo('BGN-260910-', 'BGN-260910-99'), 'BGN-260910-100');
});

test('boardUrlFrom — SUPABASE_URL의 프로젝트 ref로 대시보드 링크', () => {
  assert.equal(boardUrlFrom('https://abcdefgh.supabase.co'), 'https://supabase.com/dashboard/project/abcdefgh/editor');
});

test('maskPhone — 가운데 4자리만 가린다', () => {
  assert.equal(maskPhone('010-1234-5678'), '010-****-5678');
  assert.equal(maskPhone('01012345678'), '***');
});

test('buildClaimMessage — 이름·마스킹 전화·반려동물·병원·진료일·보험사·유입 코드·링크', () => {
  const text = buildClaimMessage({
    receiptNo: 'BGN-260910-01',
    guardianName: '홍길동',
    guardianPhone: '010-1234-5678',
    petName: '코코',
    hospitalName: '개냥동물병원',
    visitDate: '2026-09-08',
    insurer: '삼성화재',
    refCode: null,
    boardUrl: 'https://example.com/board',
  });
  assert.match(text, /BGN-260910-01/);
  assert.match(text, /홍길동 \(010-\*\*\*\*-5678\) · 반려동물: 코코/);
  assert.doesNotMatch(text, /010-1234-5678/);
  assert.match(text, /개냥동물병원/);
  assert.match(text, /유입 코드: -/);
  assert.match(text, /<https:\/\/example\.com\/board\|/);
});

// ---------------------------------------------------------------- createClaim — 가짜 PostgREST·슬랙

interface Call {
  method: string;
  url: string;
  body: Record<string, unknown> | null;
}

interface Backend {
  /** client_id 조회 결과 (호출 순서대로 꺼낸다. 비면 없음) */
  byClientId?: Array<string | null>;
  /** 당일 마지막 번호 (호출 순서대로) */
  last?: Array<string | null>;
  /** insert 결과 (호출 순서대로) */
  insert?: Array<'ok' | 'receipt_conflict' | 'client_conflict' | 'error' | 'throw'>;
  slack?: 'ok' | 'fail' | 'throw';
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** URL·method로 분기하는 가짜 fetch. 호출 기록을 calls에 남긴다 */
function fakeFetch(b: Backend, calls: Call[]): typeof fetch {
  const byClientId = [...(b.byClientId ?? [])];
  const last = [...(b.last ?? [])];
  const insert = [...(b.insert ?? [])];
  return async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    calls.push({ method, url, body });

    if (url.startsWith('https://hooks.slack.com/')) {
      if (b.slack === 'throw') throw new Error('network');
      return new Response('ok', { status: b.slack === 'fail' ? 500 : 200 });
    }
    assert.ok(url.startsWith('https://abcdefgh.supabase.co/rest/v1/claims'), url);
    if (method === 'PATCH' && url.includes('client_id=eq.')) {
      const v = byClientId.shift() ?? null;
      return json(200, v ? [{ receipt_no: v }] : []);
    }
    if (method === 'GET' && url.includes('receipt_no=like.')) {
      const v = last.shift() ?? null;
      return json(200, v ? [{ receipt_no: v }] : []);
    }
    if (method === 'POST') {
      const mode = insert.shift() ?? 'ok';
      if (mode === 'throw') throw new Error('network');
      if (mode === 'ok') return json(201, [{ id: 'row-1' }]);
      if (mode === 'error') return json(500, { message: 'boom' });
      const key = mode === 'receipt_conflict' ? 'claims_receipt_no_key' : 'claims_client_id_key';
      return json(409, { code: '23505', message: `duplicate key value violates unique constraint "${key}"`, details: 'Key already exists.' });
    }
    if (method === 'PATCH') return new Response(null, { status: 204 });
    throw new Error(`unexpected ${method} ${url}`);
  };
}

async function run(b: Backend, input: unknown = payload, env: ClaimsEnv = ENV) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = fakeFetch(b, calls);
  try {
    const result = await createClaim(input, env, NOW);
    return { result, calls };
  } finally {
    globalThis.fetch = original;
  }
}

const inserts = (calls: Call[]) => calls.filter((c) => c.method === 'POST' && c.url.includes('supabase.co'));
const slacks = (calls: Call[]) => calls.filter((c) => c.url.startsWith('https://hooks.slack.com/'));
const patches = (calls: Call[]) => calls.filter((c) => c.method === 'PATCH' && c.url.includes('id=eq.') && !c.url.includes('client_id'));
const upserts = (calls: Call[]) => calls.filter((c) => c.method === 'PATCH' && c.url.includes('client_id=eq.'));

test('createClaim — 성공: 조회 → insert → 슬랙 → slack_notified', async () => {
  const { result, calls } = await run({ last: [null] });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, receipt_no: 'BGN-260910-01' });

  const [ins] = inserts(calls);
  assert.equal(inserts(calls).length, 1);
  assert.equal(ins.body?.receipt_no, 'BGN-260910-01');
  assert.equal(ins.body?.client_id, CLIENT_ID);
  assert.ok(!('consented_at' in ins.body!));
  assert.equal(ins.body?.consent_version, 'consent-v1');

  const [slack] = slacks(calls);
  assert.equal(slacks(calls).length, 1);
  const text = String(slack.body?.text);
  assert.match(text, /BGN-260910-01/);
  assert.match(text, /개냥동물병원/);
  assert.match(text, /삼성화재/);
  assert.match(text, /유입 코드: test/);
  assert.match(text, /김민석 \(010-\*\*\*\*-5678\)/);
  assert.match(text, /코코/);
  assert.doesNotMatch(text, /010-1234-5678/);
  assert.doesNotMatch(text, /1995/);

  assert.equal(patches(calls).length, 1);
  assert.deepEqual(patches(calls)[0].body, { slack_notified: true });
  assert.match(patches(calls)[0].url, /id=eq\.row-1/);
});

test('createClaim — 같은 날 2번째는 -02', async () => {
  const { result } = await run({ last: ['BGN-260910-01'] });
  assert.deepEqual(result.body, { ok: true, receipt_no: 'BGN-260910-02' });
});

test('createClaim — receipt_no 충돌 1회면 다시 뽑아 성공', async () => {
  const { result, calls } = await run({ last: ['BGN-260910-01', 'BGN-260910-02'], insert: ['receipt_conflict', 'ok'] });
  assert.deepEqual(result.body, { ok: true, receipt_no: 'BGN-260910-03' });
  assert.equal(inserts(calls).length, 2);
});

test('createClaim — receipt_no 충돌 2회면 409', async () => {
  const { result, calls } = await run({ last: [null, null], insert: ['receipt_conflict', 'receipt_conflict'] });
  assert.equal(result.status, 409);
  assert.deepEqual(result.body, { ok: false, error: 'receipt_conflict' });
  assert.equal(slacks(calls).length, 0);
});

test('createClaim — client_id가 이미 접수됐으면 내용을 갱신하고 기존 번호, insert·슬랙 없음', async () => {
  const { result, calls } = await run({ byClientId: ['BGN-260910-07'] }, { ...payload, guardian_phone: '010-9999-0000' });
  assert.deepEqual(result.body, { ok: true, receipt_no: 'BGN-260910-07' });
  assert.equal(inserts(calls).length, 0);
  assert.equal(slacks(calls).length, 0);
  const [up] = upserts(calls);
  assert.equal(upserts(calls).length, 1);
  assert.equal(up.body?.guardian_phone, '010-9999-0000');
  assert.ok(!('receipt_no' in up.body!));
  assert.ok(!('consented_at' in up.body!));
});

test('createClaim — client_id insert 충돌(동시 재시도)이면 재조회로 기존 번호', async () => {
  const { result, calls } = await run({ byClientId: [null, 'BGN-260910-04'], last: [null], insert: ['client_conflict'] });
  assert.deepEqual(result.body, { ok: true, receipt_no: 'BGN-260910-04' });
  assert.equal(inserts(calls).length, 1);
  assert.equal(slacks(calls).length, 0);
});

test('createClaim — 슬랙 실패해도 200, slack_notified는 안 찍는다', async () => {
  for (const slack of ['fail', 'throw'] as const) {
    const { result, calls } = await run({ last: [null], slack });
    assert.equal(result.status, 200);
    assert.equal(patches(calls).length, 0);
  }
});

test('createClaim — SLACK_WEBHOOK_URL 없으면 슬랙을 건너뛰고 200', async () => {
  const { result, calls } = await run({ last: [null] }, payload, { ...ENV, slackWebhookUrl: undefined });
  assert.equal(result.status, 200);
  assert.equal(slacks(calls).length, 0);
  assert.equal(patches(calls).length, 0);
});

test('createClaim — 검증 실패 400 + field, Supabase 호출 없음', async () => {
  const { result, calls } = await run({}, { ...payload, consent_terms: false });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { ok: false, error: 'invalid_input', field: 'consent_terms' });
  assert.equal(calls.length, 0);
});

test('createClaim — env 없으면 500', async () => {
  const { result, calls } = await run({}, payload, { supabaseUrl: undefined, secretKey: undefined });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { ok: false, error: 'server_not_configured' });
  assert.equal(calls.length, 0);
});

test('createClaim — Supabase insert 5xx·네트워크 예외는 502', async () => {
  for (const mode of ['error', 'throw'] as const) {
    const { result } = await run({ last: [null], insert: [mode] });
    assert.equal(result.status, 502);
    assert.deepEqual(result.body, { ok: false, error: 'supabase_error' });
  }
});
