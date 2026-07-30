select
  case
    when ref_code is not null then '뿌린 링크: ' || ref_code
    when utm_source is not null then '광고: ' || utm_source
    when referrer ilike '%search.naver.com%' then '네이버 검색'
    when referrer ilike '%naver.com%' then '네이버 (검색 외)'
    when referrer ilike '%google.%' then '구글 검색'
    when referrer ilike '%instagram.com%' then '인스타그램 (태그 없는 링크)'
    when referrer ilike '%kakao%' then '카카오톡'
    when referrer is null or referrer = '' then '직접 유입 (주소 입력/북마크/앱)'
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
  where event = 'signup_submit' and props ->> 'status' = 'done'
)
select
  v.ref_code,
  count(distinct v.session_id) as visitors,
  count(distinct c.session_id) as signups,
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

select
  'mvp_open' as stage, count(distinct session_id) as sessions from events where event = 'mvp_open'
union all
select 'step_' || (props ->> 'step'), count(distinct session_id)
from events where event = 'mvp_step' group by 1
union all
select 'signup_done', count(distinct session_id)
from events where event = 'signup_submit' and props ->> 'status' = 'done' and props ->> 'source' = 'mvp-result'
order by stage;

select
  props ->> 'last_step' as closed_at_step,
  count(*) as closes
from events
where event = 'mvp_close'
group by 1
order by 1;

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
