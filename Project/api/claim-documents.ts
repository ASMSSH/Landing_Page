// Vercel 서버리스 함수 — 프로덕션 /api/claim-documents 엔드포인트 (필요서류 조회).
// 로직은 재사용 가능한 getClaimDocuments()에 위임하고, 여기선 요청 파싱/응답 변환만.
// 런타임(Vercel)에선 컴파일 결과가 .js이므로 import도 .js로 작성 (nodenext 규칙).
import { getClaimDocuments } from '../server/documents.js';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const result = await getClaimDocuments(
    {
      claimType: url.searchParams.get('claimType') ?? undefined,
      insurer: url.searchParams.get('insurer') ?? undefined,
    },
    {
      token: process.env.NOTION_TOKEN,
      docsDataSourceId: process.env.NOTION_DOCS_DATA_SOURCE_ID,
    },
  );
  return Response.json(result.body, { status: result.status });
}
