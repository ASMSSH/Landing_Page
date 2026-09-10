// Vercel 서버리스 함수 — 프로덕션 /api/claims 엔드포인트 (대리청구 신청 접수, POST).
// 로직은 재사용 가능한 createClaim()에 위임하고, 여기선 요청 파싱/응답 변환만 (api/subscribe.ts와 같은 모양).
// 런타임(Vercel)에선 컴파일 결과가 .js이므로 import도 .js로 작성 (nodenext 규칙).
//
// SUPABASE_SERVICE_ROLE_KEY는 여기(서버)에서만 읽는다 — VITE_ 접두사가 없어 브라우저 번들에 들어가지 않는다.
import { createClaim } from '../server/claims.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  const result = await createClaim(input, {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  });
  return Response.json(result.body, { status: result.status });
}
