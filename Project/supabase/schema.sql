-- 행동 트래킹 events 테이블.
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하면 된다. (2026-07-29 적용 완료)

create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_event_idx on public.events (event);
create index if not exists events_session_idx on public.events (session_id);

alter table public.events enable row level security;

-- 익명(publishable key)에게 insert만 허용.
-- select/update/delete 정책이 없으므로 클라이언트에서는 기록 조회·수정·삭제가 불가능하다.
create policy "anon can insert events"
  on public.events
  for insert
  to anon
  with check (
    char_length(event) <= 64
    and char_length(session_id) <= 64
    and pg_column_size(props) <= 8192
  );
