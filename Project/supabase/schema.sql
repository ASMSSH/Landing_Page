create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  ref_code text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text
);

alter table public.events add column if not exists ref_code text;

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_event_idx on public.events (event);
create index if not exists events_session_idx on public.events (session_id);

alter table public.events enable row level security;

create policy "anon can insert events"
  on public.events
  for insert
  to anon
  with check (
    char_length(event) <= 64
    and char_length(session_id) <= 64
    and pg_column_size(props) <= 8192
  );

-- ---------------------------------------------------------------------------
-- 대리청구 신청 (SSH-544). 한 청구 = 한 행. 브라우저 → POST /api/claims → 이 테이블.
-- 개인정보가 들어가므로 RLS를 켜고 anon·authenticated 정책을 두지 않는다 — 서버리스가 service role 키로만 쓴다.
-- 운영 보드는 Supabase Table Editor(status·assignee·memo 편집). 근거: 위키 「대리청구 웹 창구 설계」 ⑤·⑧.
-- ---------------------------------------------------------------------------

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  receipt_no text not null unique,                    -- BGN-YYMMDD-NN (서버가 만든다. 전화로 부를 수 있는 형식)
  client_id uuid unique,                              -- 멱등 키. 브라우저가 만들고 「다시 시도」 때 같은 값 → 중복 접수 방지
  guardian_name text not null,
  guardian_phone text not null,                       -- 010-XXXX-XXXX
  guardian_birth date not null,
  pet_name text not null,
  hospital_name text not null,
  hospital_address text,
  visit_date date not null,
  treatment_cost integer not null check (treatment_cost >= 0),   -- 원
  diagnosis text,
  insurer text not null,
  product_name text,
  required_docs jsonb,                                -- S3 스냅샷 { insurer, claimType, hospitalIssued[], selfPrepared[], fallback }
  consent_terms boolean not null,
  consent_privacy boolean not null,
  consent_unique_id boolean not null,
  consent_hospital_3p boolean not null,
  consent_insurer_3p boolean not null,
  consented_at timestamptz not null default now(),   -- 서버(DB) 시각. 클라이언트 시계를 믿지 않는다
  consent_version text not null,                      -- consent-v1 (src/apply/consents.ts)
  ref_code text,                                      -- ?r= 유입 코드
  status text not null default '신규' check (status in ('신규', '확인중', '서류확보', '청구완료')),
  assignee text,
  memo text,
  slack_notified boolean not null default false
);

create index if not exists claims_created_at_idx on public.claims (created_at desc);

alter table public.claims enable row level security;
-- 정책 없음: anon 키로는 select/insert 전부 거부된다. service role은 RLS를 우회한다.
