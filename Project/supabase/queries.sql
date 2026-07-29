-- 분석용 쿼리 모음. Supabase 대시보드 > SQL Editor에서 실행.
-- (RLS는 클라이언트 키만 제한하며, 대시보드에서는 모든 데이터를 볼 수 있다)

-- 1. 채널별 유입 수 (세션 기준)
select
  coalesce(utm_source, '(직접 유입/미분류)') as source,
  coalesce(utm_campaign, '-') as campaign,
  count(distinct session_id) as visitors
from events
where event = 'page_view'
group by 1, 2
order by visitors desc;

-- 2. 채널별 전환율 (방문 → 알림 신청)
with visits as (
  select coalesce(utm_source, '(직접)') as source, session_id
  from events where event = 'page_view'
  group by 1, 2
),
converts as (
  select distinct session_id
  from events
  where event = 'signup_submit' and props ->> 'status' = 'done'
)
select
  v.source,
  count(distinct v.session_id) as visitors,
  count(distinct c.session_id) as signups,
  round(100.0 * count(distinct c.session_id) / count(distinct v.session_id), 1) as conversion_pct
from visits v
left join converts c on c.session_id = v.session_id
group by 1
order by visitors desc;

-- 3. 스크롤 도달률 (방문자 중 몇 %가 페이지의 25/50/75/100%까지 내렸는지)
select
  (props ->> 'percent')::int as scroll_percent,
  count(distinct session_id) as sessions,
  round(100.0 * count(distinct session_id)
    / (select count(distinct session_id) from events where event = 'page_view'), 1) as pct_of_visitors
from events
where event = 'scroll_depth'
group by 1
order by 1;

-- 4. 섹션별 도달률 (어떤 섹션까지 보는지)
select
  props ->> 'section' as section,
  count(distinct session_id) as sessions
from events
where event = 'section_view'
group by 1
order by sessions desc;

-- 5. 체험 모달 퍼널 (열기 → 1~4단계 → 신청)
select
  'mvp_open' as stage, count(distinct session_id) as sessions from events where event = 'mvp_open'
union all
select 'step_' || (props ->> 'step'), count(distinct session_id)
from events where event = 'mvp_step' group by 1
union all
select 'signup_done', count(distinct session_id)
from events where event = 'signup_submit' and props ->> 'status' = 'done' and props ->> 'source' = 'mvp-result'
order by stage;

-- 6. 모달 이탈 지점 (어느 단계에서 닫았는지)
select
  props ->> 'last_step' as closed_at_step,
  count(*) as closes
from events
where event = 'mvp_close'
group by 1
order by 1;

-- 7. 평균 체류 시간 · 최대 스크롤 (이탈 이벤트 기준)
select
  count(distinct session_id) as sessions,
  round(avg((props ->> 'seconds_active')::int), 1) as avg_seconds_on_page,
  round(avg((props ->> 'max_scroll_percent')::int), 1) as avg_max_scroll_pct
from events
where event = 'page_leave';

-- 8. 가장 많이 클릭된 요소 Top 20
select
  props ->> 'section' as section,
  coalesce(props ->> 'text', props ->> 'input_type') as element,
  count(*) as clicks
from events
where event = 'click'
group by 1, 2
order by clicks desc
limit 20;

-- 9. FAQ에서 가장 궁금해하는 질문
select props ->> 'question' as question, count(*) as opens
from events
where event = 'faq_open'
group by 1
order by opens desc;

-- 10. 기기·재방문 비율
select
  device,
  count(distinct session_id) as sessions,
  count(distinct session_id) filter (where (props ->> 'is_returning')::boolean) as returning_sessions
from events
where event = 'page_view'
group by 1;

-- 11. 특정 세션의 행동 타임라인 재구성 (세션 ID를 바꿔서 실행)
-- select created_at, event, props from events
-- where session_id = '여기에-세션-ID'
-- order by created_at;
