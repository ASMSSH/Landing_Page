// Vercel 서버리스 함수 — 프로덕션 /api/subscribe 엔드포인트.
// 로직은 재사용 가능한 subscribe()에 위임하고, 여기선 요청 파싱/응답 변환만.
// 런타임(Vercel)에선 컴파일 결과가 .js이므로 import도 .js로 작성 (nodenext 규칙).
import { subscribe } from '../server/notion.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  const result = await subscribe(input as Parameters<typeof subscribe>[0], {
    token: process.env.NOTION_TOKEN,
    dataSourceId: process.env.NOTION_SUBSCRIBE_DATA_SOURCE_ID,
    otpSecret: process.env.OTP_SECRET,
  });
  return Response.json(result.body, { status: result.status });
}
