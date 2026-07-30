import { verifyOtp } from '../server/otp.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
  const result = await verifyOtp(input as Parameters<typeof verifyOtp>[0], {
    octomoApiKey: process.env.OCTOMO_API_KEY,
    otpSecret: process.env.OTP_SECRET,
  });
  return Response.json(result.body, { status: result.status });
}
