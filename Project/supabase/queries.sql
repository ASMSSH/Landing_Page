-- 랜딩·/apply 지표 쿼리 (Supabase SQL Editor에서 실행). 이벤트 이름은 src/lib/analytics.ts와 src/apply/*의 track() 호출이 정본이다.
-- 2026-09-12(SSH-545)부터: 체험 모달(mvp_*)·사전 알림(signup_submit·otp_*) 이벤트는 더 오지 않고, 전환은 /apply의 apply_done이다.
--   section_view·click의 section 값 'signup'(사전 알림 섹션)은 같은 날부터 'cta'(하단 CTA 섹션)다.

select
  case
    when ref_code is not null then ref_code
    when utm_source is not null then '광고: ' || utm_source
    when referrer ilike '%search.naver.com%' then '네이버 검색'
    when referrer ilike '%google.%' then '구글 검색'
    when referrer is null or referrer = '' then '직접 유입'
    else '기타: ' || referrer
  end as channel,
  count(distinct session_id) as visitors
from events
where event = 'page_view'
group by 1
order by visitors desc;

select
  coalesce(ref_code, '(코드 없음)') as ref_code,
  count(distinct session_id) as visitors
from events
where event = 'page_view'
group by 1
order by visitors desc;

with visits as (
  select coalesce(ref_code, '(코드 없음)') as ref_code, session_id
  from events where event = 'page_view'
  group by 1, 2
),
converts as (
  select distinct session_id
  from events
  where event = 'apply_done'
)
select
  v.ref_code,
  count(distinct v.session_id) as visitors,
  count(distinct c.session_id) as applications,
  round(100.0 * count(distinct c.session_id) / count(distinct v.session_id), 1) as conversion_pct
from visits v
left join converts c on c.session_id = v.session_id
group by 1
order by visitors desc;

select
  (props ->> 'percent')::int as scroll_percent,
  count(distinct session_id) as sessions,
  round(100.0 * count(distinct session_id)
    / (select count(distinct session_id) from events where event = 'page_view'), 1) as pct_of_visitors
from events
where event = 'scroll_depth'
group by 1
order by 1;

select
  props ->> 'section' as section,
  count(distinct session_id) as sessions
from events
where event = 'section_view'
group by 1
order by sessions desc;

-- /apply 퍼널 — 단계별 도달 세션. apply_step은 되돌아간 단계도 다시 찍히므로 distinct로 센다
select 'step_' || (props ->> 'step') as stage, count(distinct session_id) as sessions
from events where event = 'apply_step' group by 1
union all
select 'submit', count(distinct session_id) from events where event = 'apply_submit'
union all
select 'done', count(distinct session_id) from events where event = 'apply_done'
union all
select 'error', count(distinct session_id) from events where event = 'apply_error'
order by stage;

-- S1 영수증 OCR 결과 분포 (ok / fail+reason / skip = 직접 입력)
select
  props ->> 'result' as result,
  props ->> 'reason' as reason,
  count(*) as events,
  count(distinct session_id) as sessions
from events
where event = 'apply_ocr'
group by 1, 2
order by 1, 2;

-- S3 필요 서류 — 보험사별 도달 수와 fallback(조회 실패·기타/모름) 비율
select
  props ->> 'insurer' as insurer,
  count(distinct session_id) as sessions,
  count(distinct session_id) filter (where (props ->> 'fallback')::boolean) as fallback_sessions,
  round(avg((props ->> 'docs_count')::int), 1) as avg_docs
from events
where event = 'apply_docs'
group by 1
order by sessions desc;

-- S5 신청 실패 원인 (submitClaim의 error 코드)
select props ->> 'error' as error, count(*) as failures
from events
where event = 'apply_error'
group by 1
order by failures desc;

select
  count(distinct session_id) as sessions,
  round(avg((props ->> 'seconds_active')::int), 1) as avg_seconds_on_page,
  round(avg((props ->> 'max_scroll_percent')::int), 1) as avg_max_scroll_pct
from events
where event = 'page_leave';

select
  props ->> 'section' as section,
  coalesce(props ->> 'text', props ->> 'input_type') as element,
  count(*) as clicks
from events
where event = 'click'
group by 1, 2
order by clicks desc
limit 20;

select props ->> 'question' as question, count(*) as opens
from events
where event = 'faq_open'
group by 1
order by opens desc;

select
  device,
  count(distinct session_id) as sessions,
  count(distinct session_id) filter (where (props ->> 'is_returning')::boolean) as returning_sessions
from events
where event = 'page_view'
group by 1;
