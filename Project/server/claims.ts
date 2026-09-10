// 대리청구 신청 접수 핸들러 — 서버 전용 (브라우저에서 import 금지).
// Vite dev 미들웨어(vite.config.ts)와 Vercel 서버리스(api/claims.ts)가 같이 쓴다. server/notion.ts와 같은 모양.
//
// 흐름: 입력 검증 → (멱등 키로 기존 행 갱신) → 접수번호 BGN-YYMMDD-NN → Supabase insert → 슬랙 1통 → { ok, receipt_no }
//
// 입력은 SSH-486 클라이언트(src/apply/claimPayload.ts)가 보내는 claims 컬럼 snake_case 그대로다 — 매핑이 없다.
// 검증 규칙은 클라이언트(src/apply/validateApplicant.ts·validateTreatment.ts)와 같은 수준으로 **복제**했다.
// server/는 src/를 import하지 않는다 — Vercel이 api/를 따로 번들하므로 경계를 지킨다 (spec 「배경」).
//
// 로그에는 접수번호·error 코드·상태 코드만 찍는다. 본문(이름·전화·생년월일)은 Vercel 로그에도 남기지 않는다.
//
// PostgREST 호출·슬랙 문안이 별도 파일이 아니라 여기 한 파일에 있는 이유: server/ 파일끼리의 import는 Vercel·Vite 규칙상
// `.js` 확장자여야 하는데(nodenext) `node --test`는 `.js`를 `.ts`로 되돌려 주지 않아 테스트가 모듈을 못 찾는다.
// 그래서 절(section)로만 나눴다 — 「PostgREST」 「슬랙」 「검증」 「접수」.

export interface ClaimsEnv {
  supabaseUrl?: string;
  secretKey?: string;
  /** 없으면 슬랙만 건너뛴다 — 저장은 된다 */
  slackWebhookUrl?: string;
}

export interface RequiredDocs {
  insurer: string;
  claimType: string;
  hospitalIssued: string[];
  selfPrepared: string[];
  fallback: boolean;
}

/** insert 본문. consented_at은 없다 — DB default now() */
export interface ClaimRow {
  client_id: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_birth: string;
  pet_name: string;
  hospital_name: string;
  hospital_address: string | null;
  visit_date: string;
  treatment_cost: number;
  diagnosis: string | null;
  insurer: string;
  product_name: string | null;
  required_docs: RequiredDocs | null;
  consent_terms: true;
  consent_privacy: true;
  consent_unique_id: true;
  consent_hospital_3p: true;
  consent_insurer_3p: true;
  consent_version: string;
  ref_code: string | null;
}

export type ClaimsBody = { ok: true; receipt_no: string } | { ok: false; error: string; field?: string };

export interface ClaimsResult {
  status: number;
  body: ClaimsBody;
}

export type Validation = { ok: true; row: ClaimRow } | { ok: false; field: string };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^010-\d{4}-\d{4}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CONSENT_VERSION_RE = /^consent-v\d+$/;
const MAX_COST = 99_999_999;
const MAX_DOCS = 50;
const MIN_AGE = 14;

// ---------------------------------------------------------------- PostgREST (secret key — RLS 우회)
// SDK 없이 fetch로 부른다 — src/lib/analytics.ts가 events 테이블에 쓰는 방식과 같고(위키 ⑦), 키만 다르다.
// 이 절의 함수는 throw하지 않는다 — 네트워크 예외·타임아웃은 { ok: false, status: 0 }으로 돌려준다.

export interface SupabaseEnv {
  /** https://<ref>.supabase.co (끝 슬래시 없이) */
  url: string;
  /** secret key — 대시보드 API Keys의 sb_secret_… (또는 legacy service_role JWT). RLS를 우회하므로 서버에만 둔다 */
  key: string;
}

export type LookupResult = { ok: true; value: string | null } | { ok: false; status: number };

export type InsertResult =
  | { ok: true; id: string }
  | { ok: false; conflict: 'receipt_no' | 'client_id' | null; status: number };

const TABLE = 'claims';
const SUPABASE_TIMEOUT_MS = 5000;

async function request(env: SupabaseEnv, query: string, init: RequestInit & { headers?: Record<string, string> }): Promise<Response | null> {
  try {
    return await fetch(`${env.url.replace(/\/+$/, '')}/rest/v1/${TABLE}${query}`, {
      ...init,
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

/** select=receipt_no&limit=1 결과의 첫 행 receipt_no. 행이 없으면 null */
async function firstReceiptNo(env: SupabaseEnv, query: string): Promise<LookupResult> {
  const res = await request(env, query, { method: 'GET' });
  if (!res) return { ok: false, status: 0 };
  if (!res.ok) return { ok: false, status: res.status };
  const rows = (await res.json().catch(() => [])) as Array<{ receipt_no?: string }>;
  const first = Array.isArray(rows) ? rows[0] : undefined;
  return { ok: true, value: typeof first?.receipt_no === 'string' ? first.receipt_no : null };
}

/**
 * 멱등 키로 이미 접수된 행이 있으면 **내용을 이 요청으로 갱신**하고 그 행의 receipt_no를 돌려준다. 없으면 null.
 * 갱신하는 이유: 타임아웃으로 실패 배너를 본 사용자가 S4로 돌아가 전화번호를 고치고 다시 보내는 경우, 접수번호는 같아야 하지만
 * 담당자가 연락할 값은 마지막에 보낸 것이어야 한다 (AI 리뷰 P2). receipt_no·created_at·consented_at·status·assignee·memo는
 * 본문에 없으니 그대로 남는다. clientId는 UUID 검증을 통과한 값만 온다.
 */
export async function updateByClientId(env: SupabaseEnv, clientId: string, row: object): Promise<LookupResult> {
  const res = await request(env, `?client_id=eq.${encodeURIComponent(clientId)}&select=receipt_no`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res) return { ok: false, status: 0 };
  if (!res.ok) return { ok: false, status: res.status };
  const rows = (await res.json().catch(() => [])) as Array<{ receipt_no?: string }>;
  const first = Array.isArray(rows) ? rows[0] : undefined;
  return { ok: true, value: typeof first?.receipt_no === 'string' ? first.receipt_no : null };
}

/**
 * 당일 접수번호 중 마지막 것. prefix는 `BGN-YYMMDD-`처럼 서버가 만든 문자열이라 like 이스케이프가 필요 없다.
 * NN이 2자리를 넘어도(100~) 문자열 desc 정렬이 깨지지 않게 하려면 길이가 같아야 하는데, 하루 100건은 MVP 밖이다 —
 * 그때는 unique 충돌 → 1회 재시도가 받쳐 준다.
 */
export function lastReceiptNoOfDay(env: SupabaseEnv, prefix: string): Promise<LookupResult> {
  return firstReceiptNo(env, `?receipt_no=like.${encodeURIComponent(prefix + '*')}&select=receipt_no&order=receipt_no.desc&limit=1`);
}

/**
 * 행 1개 insert. unique 충돌(Postgres 23505)은 제약 이름으로 어느 키가 겹쳤는지 분류한다 —
 * receipt_no면 번호를 다시 뽑아 재시도, client_id면 같은 신청이 동시에 두 번 온 것이라 기존 행을 돌려준다.
 */
export async function insertClaim(env: SupabaseEnv, row: Record<string, unknown>): Promise<InsertResult> {
  const res = await request(env, '?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res) return { ok: false, conflict: null, status: 0 };
  if (res.ok) {
    const rows = (await res.json().catch(() => [])) as Array<{ id?: string }>;
    const id = Array.isArray(rows) ? rows[0]?.id : undefined;
    return typeof id === 'string' ? { ok: true, id } : { ok: false, conflict: null, status: res.status };
  }
  const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string; details?: string };
  if (res.status === 409 && body.code === '23505') {
    const text = `${body.message ?? ''} ${body.details ?? ''}`;
    if (text.includes('claims_receipt_no_key')) return { ok: false, conflict: 'receipt_no', status: 409 };
    if (text.includes('claims_client_id_key')) return { ok: false, conflict: 'client_id', status: 409 };
  }
  return { ok: false, conflict: null, status: res.status };
}

/** 슬랙 전송이 성공한 행에 표시. 실패해도 접수에는 영향이 없으니 결과를 보지 않는다 */
export async function markSlackNotified(env: SupabaseEnv, id: string): Promise<void> {
  await request(env, `?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ slack_notified: true }),
  });
}

// ---------------------------------------------------------------- 슬랙 Incoming Webhook
// 접수 직후 1통. 담당자가 알림만 보고 누구인지 알 수 있게 보호자 이름·반려동물 이름은 넣고, **전화번호는 뒤 4자리만**
// (010-****-5678) 남긴다 — 전체 번호는 Table Editor 링크에서. 생년월일은 넣지 않는다. 설계 §6-2의 「이름·전화번호 금지」를
// 2026-09-10 사용자 결정으로 이렇게 완화했다 — 슬랙에 개인정보 원문이 남지 않아 처리방침 수탁자 변경 없이 가는 선.
// 슬랙이 실패해도 접수는 살린다 — boolean만 보고 넘어간다. 자동 재시도 없음.

export interface ClaimNotice {
  receiptNo: string;
  guardianName: string;
  /** 010-XXXX-XXXX — buildClaimMessage가 마스킹한다 */
  guardianPhone: string;
  petName: string;
  hospitalName: string;
  /** YYYY-MM-DD */
  visitDate: string;
  insurer: string;
  refCode: string | null;
  /** Supabase Table Editor 링크 — 담당자가 바로 행을 연다 */
  boardUrl: string;
}

const SLACK_TIMEOUT_MS = 3000;

/** 010-1234-5678 → 010-****-5678. 형식이 다르면 전부 가린다 */
export function maskPhone(phone: string): string {
  const m = /^(\d{3})-(\d{4})-(\d{4})$/.exec(phone);
  return m ? `${m[1]}-****-${m[3]}` : '***';
}

/** mrkdwn 한 통. 순수 함수 — 테스트에서 전화번호 원문·생년월일이 없는지 확인한다 */
export function buildClaimMessage(n: ClaimNotice): string {
  return [
    `🐾 새 대리청구 신청 *${n.receiptNo}*`, // 멘션 없음 — <!channel>을 넣어 봤다가 뺐다(2026-09-11). 알림은 각자 채널 설정 「모든 새 메시지」로
    `• 보호자: ${n.guardianName} (${maskPhone(n.guardianPhone)}) · 반려동물: ${n.petName}`,
    `• 병원: ${n.hospitalName}`,
    `• 진료일: ${n.visitDate}`,
    `• 보험사: ${n.insurer}`,
    `• 유입 코드: ${n.refCode ?? '-'}`,
    `<${n.boardUrl}|Table Editor에서 전화번호 보기>`,
  ].join('\n');
}

/** webhook에 text 한 통. 비-2xx·네트워크 예외·타임아웃은 전부 false */
export async function notifySlack(webhookUrl: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- 날짜 (KST)

/** UTC now를 KST 달력으로 옮긴 Date. getUTC*로 읽어야 KST 값이 나온다 */
function kstDate(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

/** 검증의 「오늘」 — YYYY-MM-DD (KST) */
export function todayKst(now: Date): string {
  return kstDate(now).toISOString().slice(0, 10);
}

/** 접수번호 앞부분 `BGN-YYMMDD-` (KST). NN은 nextReceiptNo가 붙인다 */
export function receiptPrefix(now: Date): string {
  return `BGN-${kstDate(now).toISOString().slice(2, 10).replace(/-/g, '')}-`;
}

/** 당일 마지막 번호 + 1. 없으면 01. 2자리 패딩, 100부터는 그대로 */
export function nextReceiptNo(prefix: string, last: string | null): string {
  const n = last?.startsWith(prefix) ? Number.parseInt(last.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isFinite(n) ? n : 0) + 1).padStart(2, '0')}`;
}

/** `https://<ref>.supabase.co` → 대시보드 Table Editor. 새 env를 두지 않는다 (spec 결정 4) */
export function boardUrlFrom(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  return `https://supabase.com/dashboard/project/${ref}/editor`;
}

// ---------------------------------------------------------------- 검증

/** YYYY-MM-DD가 달력에 있는 날인가 (validateTreatment.ts#isRealDate와 같은 규칙) */
function isRealDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** 만 나이 — 연·월·일 비교, 생일 당일에 한 살 (validateApplicant.ts#ageOn과 같은 규칙) */
function ageOn(birth: string, today: string): number {
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

function str(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v.length >= min && v.length <= max ? v : null;
}

/** 선택 칸: null·undefined·빈 문자열 → null, 그 외는 길이 검사. 실패는 undefined */
function optionalStr(value: unknown, max: number): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v) return null;
  return v.length <= max ? v : undefined;
}

function strList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_DOCS) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length > 200) return null;
    out.push(item);
  }
  return out;
}

/** S3 스냅샷. 아는 키만 남긴다 — 그 외 키는 버린다 */
function requiredDocs(value: unknown): RequiredDocs | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const insurer = str(v.insurer, 0, 50);
  const claimType = str(v.claimType, 0, 50);
  const hospitalIssued = strList(v.hospitalIssued);
  const selfPrepared = strList(v.selfPrepared);
  if (insurer === null || claimType === null || !hospitalIssued || !selfPrepared || typeof v.fallback !== 'boolean') return undefined;
  return { insurer, claimType, hospitalIssued, selfPrepared, fallback: v.fallback };
}

const CONSENT_KEYS = ['consent_terms', 'consent_privacy', 'consent_unique_id', 'consent_hospital_3p', 'consent_insurer_3p'] as const;

/**
 * 요청 본문 → insert 행. 첫 번째로 걸린 필드 이름을 돌려준다.
 * 인증이 없는 공개 API라 클라이언트가 이미 검증했어도 여기서 다시 본다.
 */
export function validateClaimInput(input: unknown, today: string): Validation {
  if (!input || typeof input !== 'object') return { ok: false, field: 'body' };
  const v = input as Record<string, unknown>;
  const fail = (field: string): Validation => ({ ok: false, field });

  let client_id: string | null = null;
  if (v.client_id !== null && v.client_id !== undefined) {
    if (typeof v.client_id !== 'string' || !UUID_RE.test(v.client_id)) return fail('client_id');
    client_id = v.client_id.toLowerCase();
  }

  const guardian_name = str(v.guardian_name, 2, 20);
  if (guardian_name === null) return fail('guardian_name');
  if (typeof v.guardian_phone !== 'string' || !PHONE_RE.test(v.guardian_phone)) return fail('guardian_phone');
  const guardian_phone = v.guardian_phone;
  if (typeof v.guardian_birth !== 'string' || !isRealDate(v.guardian_birth) || v.guardian_birth >= today || ageOn(v.guardian_birth, today) < MIN_AGE) {
    return fail('guardian_birth');
  }
  const guardian_birth = v.guardian_birth;
  const pet_name = str(v.pet_name, 1, 20);
  if (pet_name === null) return fail('pet_name');

  const hospital_name = str(v.hospital_name, 1, 100);
  if (hospital_name === null) return fail('hospital_name');
  const hospital_address = optionalStr(v.hospital_address, 200);
  if (hospital_address === undefined) return fail('hospital_address');
  if (typeof v.visit_date !== 'string' || !isRealDate(v.visit_date) || v.visit_date > today) return fail('visit_date');
  const visit_date = v.visit_date;
  if (typeof v.treatment_cost !== 'number' || !Number.isInteger(v.treatment_cost) || v.treatment_cost < 0 || v.treatment_cost > MAX_COST) {
    return fail('treatment_cost');
  }
  const treatment_cost = v.treatment_cost;
  const diagnosis = optionalStr(v.diagnosis, 200);
  if (diagnosis === undefined) return fail('diagnosis');

  const insurer = str(v.insurer, 1, 50);
  if (insurer === null) return fail('insurer');
  const product_name = optionalStr(v.product_name, 100);
  if (product_name === undefined) return fail('product_name');

  const required_docs = requiredDocs(v.required_docs);
  if (required_docs === undefined) return fail('required_docs');

  for (const key of CONSENT_KEYS) if (v[key] !== true) return fail(key);
  if (typeof v.consent_version !== 'string' || !CONSENT_VERSION_RE.test(v.consent_version)) return fail('consent_version');
  const consent_version = v.consent_version;
  const ref_code = optionalStr(v.ref_code, 32);
  if (ref_code === undefined) return fail('ref_code');

  return {
    ok: true,
    row: {
      client_id,
      guardian_name,
      guardian_phone,
      guardian_birth,
      pet_name,
      hospital_name,
      hospital_address,
      visit_date,
      treatment_cost,
      diagnosis,
      insurer,
      product_name,
      required_docs,
      consent_terms: true,
      consent_privacy: true,
      consent_unique_id: true,
      consent_hospital_3p: true,
      consent_insurer_3p: true,
      consent_version,
      ref_code,
    },
  };
}

// ---------------------------------------------------------------- 접수

const SUPABASE_ERROR: ClaimsResult = { status: 502, body: { ok: false, error: 'supabase_error' } };

/**
 * 신청 1건 접수. 응답 계약은 SSH-486 클라이언트(src/lib/claims.ts)와 같다 —
 * 성공 200 { ok: true, receipt_no } / 실패 비-2xx { ok: false, error }.
 * `now`는 테스트에서 KST 경계를 고정하기 위한 인자다.
 */
export async function createClaim(input: unknown, env: ClaimsEnv, now = new Date()): Promise<ClaimsResult> {
  if (!env.supabaseUrl || !env.secretKey) {
    return { status: 500, body: { ok: false, error: 'server_not_configured' } };
  }
  const db: SupabaseEnv = { url: env.supabaseUrl, key: env.secretKey };

  const validated = validateClaimInput(input, todayKst(now));
  if (!validated.ok) return { status: 400, body: { ok: false, error: 'invalid_input', field: validated.field } };
  const { row } = validated;

  // 멱등: 같은 client_id가 이미 접수됐으면 내용을 갱신하고 그 번호를 돌려준다 (「다시 시도」가 만드는 중복 접수 방지).
  // 슬랙은 다시 보내지 않는다 — 처음 insert 때 이미 갔다
  if (row.client_id) {
    const existing = await updateByClientId(db, row.client_id, row);
    if (!existing.ok) return SUPABASE_ERROR;
    if (existing.value) return { status: 200, body: { ok: true, receipt_no: existing.value } };
  }

  // 접수번호: 당일 마지막 NN + 1. unique 충돌(동시 신청)이면 한 번 더 뽑는다
  const prefix = receiptPrefix(now);
  let inserted: { id: string; receiptNo: string } | null = null;
  for (let attempt = 0; attempt < 2 && !inserted; attempt += 1) {
    const last = await lastReceiptNoOfDay(db, prefix);
    if (!last.ok) return SUPABASE_ERROR;
    const receiptNo = nextReceiptNo(prefix, last.value);
    const result = await insertClaim(db, { ...row, receipt_no: receiptNo });
    if (result.ok) {
      inserted = { id: result.id, receiptNo };
    } else if (result.conflict === 'client_id' && row.client_id) {
      // 같은 신청이 동시에 두 번 온 경합 — 먼저 들어간 행을 갱신하고 그 번호를 돌려준다
      const existing = await updateByClientId(db, row.client_id, row);
      if (existing.ok && existing.value) return { status: 200, body: { ok: true, receipt_no: existing.value } };
      return SUPABASE_ERROR;
    } else if (result.conflict !== 'receipt_no') {
      console.error('[claims] insert 실패', result.status);
      return SUPABASE_ERROR;
    }
  }
  if (!inserted) {
    console.error('[claims] 접수번호 충돌 2회', prefix);
    return { status: 409, body: { ok: false, error: 'receipt_conflict' } };
  }

  // 슬랙: 실패해도 접수는 성공이다. 자동 재시도 없음 (설계 §6-2)
  if (env.slackWebhookUrl) {
    const text = buildClaimMessage({
      receiptNo: inserted.receiptNo,
      guardianName: row.guardian_name,
      guardianPhone: row.guardian_phone,
      petName: row.pet_name,
      hospitalName: row.hospital_name,
      visitDate: row.visit_date,
      insurer: row.insurer,
      refCode: row.ref_code,
      boardUrl: boardUrlFrom(env.supabaseUrl),
    });
    if (await notifySlack(env.slackWebhookUrl, text)) await markSlackNotified(db, inserted.id);
    else console.error('[claims] 슬랙 알림 실패', inserted.receiptNo);
  }

  return { status: 200, body: { ok: true, receipt_no: inserted.receiptNo } };
}
