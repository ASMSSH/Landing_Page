import { defineConfig, loadEnv, type Connect, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { getClaimDocuments } from './server/documents.ts'
import { analyzeReceipt } from './server/gemini.ts'
import { createClaim } from './server/claims.ts'

// 로컬 dev 전용 /api/claim-documents 엔드포인트 (필요서류 조회, GET).
// NOTION_TOKEN + NOTION_DOCS_DATA_SOURCE_ID(서류 데이터소스)를 쓴다. 노션을 부르는 유일한 경로다 (사전 알림은 SSH-545에서 제거).
function documentsApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-claim-documents-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'GET') return next()
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        const url = new URL(req.url ?? '', 'http://localhost')
        getClaimDocuments(
          {
            claimType: url.searchParams.get('claimType') ?? undefined,
            insurer: url.searchParams.get('insurer') ?? undefined,
          },
          { token: env.NOTION_TOKEN, docsDataSourceId: env.NOTION_DOCS_DATA_SOURCE_ID },
        )
          .then((result) => send(result.status, result.body))
          .catch(() => send(500, { ok: false, error: 'server_error' }))
      }
      server.middlewares.use('/api/claim-documents', handler)
    },
  }
}

// 로컬 dev 전용 /api/analyze-receipt 엔드포인트 (Gemini 이미지 분석, POST).
function geminiApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-gemini-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 6e6) req.destroy()
        })
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try {
            const input = raw ? JSON.parse(raw) : {}
            const result = await analyzeReceipt(input, {
              apiKey: env.GEMINI_API_KEY,
              model: env.GEMINI_MODEL,
            })
            send(result.status, result.body)
          } catch {
            send(400, { error: '요청 형식이 올바르지 않습니다.' })
          }
        })
      }
      server.middlewares.use('/api/analyze-receipt', handler)
    },
  }
}

// 로컬 dev 전용 /api/claims 엔드포인트 (대리청구 신청 접수, POST).
// SUPABASE_SECRET_KEY 는 서버(Node)에서만 읽혀 클라이언트 번들에 포함되지 않음. URL 은 브라우저용 VITE_SUPABASE_URL 을 같이 쓴다.
// SLACK_WEBHOOK_URL 은 없으면 알림만 건너뛴다.
function claimsApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-claims-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        let tooLarge = false
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 1e5) tooLarge = true // api/claims.ts와 같은 상한 — 413으로 답한다
        })
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          if (tooLarge) return send(413, { ok: false, error: 'payload_too_large' })
          let input: unknown
          try {
            input = raw ? JSON.parse(raw) : {}
          } catch {
            return send(400, { ok: false, error: 'bad_request' })
          }
          const result = await createClaim(input, {
            supabaseUrl: env.VITE_SUPABASE_URL,
            secretKey: env.SUPABASE_SECRET_KEY,
            slackWebhookUrl: env.SLACK_WEBHOOK_URL,
          })
          send(result.status, result.body)
        })
      }
      server.middlewares.use('/api/claims', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), documentsApi(env), geminiApi(env), claimsApi(env)],
  }
})
