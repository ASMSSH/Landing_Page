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
