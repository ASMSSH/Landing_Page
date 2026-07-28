// Vercel 서버리스 함수 — 프로덕션 /api/otp-verify 엔드포인트.
// 로직은 재사용 가능한 verifyOtp()에 위임하고, 여기선 요청 파싱/응답 변환만.
import { verifyOtp } from '../server/otp.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  const result = verifyOtp(input as Parameters<typeof verifyOtp>[0], {
    signingSecret: process.env.OTP_SIGNING_SECRET,
  });
  return Response.json(result.body, { status: result.status });
}
