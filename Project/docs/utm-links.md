# 채널별 유입 추적 링크 (UTM)

홍보 글에는 **반드시 아래 링크를 그대로** 사용하세요.
네이버 카페·인스타그램은 앱 내 브라우저라 referrer(유입 경로)가 지워지는 경우가 많아,
링크 자체에 출처를 심어야 정확하게 잡힙니다.

## 준비된 링크

| 채널 | 링크 |
|---|---|
| 네이버 강사모 카페 | `https://www.boheomgaenyang.com/?utm_source=naver_cafe&utm_medium=community&utm_campaign=gangsamo` |
| 네이버 블로그 홍보 | `https://www.boheomgaenyang.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=launch` |
| 인스타 공식계정 게시글1 | `https://www.boheomgaenyang.com/?utm_source=instagram&utm_medium=social&utm_campaign=post1` |
| 인스타 공식계정 스토리 | `https://www.boheomgaenyang.com/?utm_source=instagram&utm_medium=social&utm_campaign=story1` |

## 새 채널 링크 만드는 규칙

```
https://www.boheomgaenyang.com/?utm_source=<어디서>&utm_medium=<종류>&utm_campaign=<게시물 구분>
```

- `utm_source` — 플랫폼: `naver_cafe`, `naver_blog`, `instagram`, `kakao`, `everytime` …
- `utm_medium` — 형태: `community`(카페/커뮤니티), `blog`, `social`(SNS), `dm`, `paid`(광고)
- `utm_campaign` — 게시물 구분: `post2`, `story2`, `launch_event` 처럼 자유롭게

같은 채널이라도 게시물이 다르면 `utm_campaign`을 다르게 해야 어떤 글이 효과 있었는지 비교할 수 있어요.

## 데이터 확인

Supabase 대시보드 → SQL Editor에서 `supabase/queries.sql`의 쿼리를 실행하면
채널별 유입 수·전환율을 바로 볼 수 있습니다.
