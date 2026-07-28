// Vercel 서버리스 함수 — 프로덕션 /api/otp-send 엔드포인트.
// 로직은 재사용 가능한 sendOtp()에 위임하고, 여기선 요청 파싱/응답 변환만.
import { sendOtp } from '../server/otp.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  const result = await sendOtp(input as Parameters<typeof sendOtp>[0], {
    signingSecret: process.env.OTP_SIGNING_SECRET,
    solapiApiKey: process.env.SOLAPI_API_KEY,
    solapiApiSecret: process.env.SOLAPI_API_SECRET,
    solapiSenderNumber: process.env.SOLAPI_SENDER_NUMBER,
  });
  return Response.json(result.body, { status: result.status });
}
