// Vercel 서버리스 함수 — 프로덕션 /api/analyze-receipt 엔드포인트.
import { analyzeReceipt } from '../server/gemini.js';

export async function POST(request: Request): Promise<Response> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const result = await analyzeReceipt(
    input as Parameters<typeof analyzeReceipt>[0],
    {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    },
  );
  return Response.json(result.body, { status: result.status });
}
