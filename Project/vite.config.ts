import { defineConfig, loadEnv, type Connect, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { subscribe } from './server/notion.ts'
import { getClaimDocuments } from './server/documents.ts'
import { analyzeReceipt } from './server/gemini.ts'
import { sendOtp, verifyOtp } from './server/otp.ts'

// 로컬 dev 전용 /api/subscribe 엔드포인트.
// NOTION_TOKEN 은 서버(Node)에서만 읽혀 클라이언트 번들에 포함되지 않음.
function subscribeApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-subscribe-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 1e5) req.destroy()
        })
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try {
            const input = raw ? JSON.parse(raw) : {}
            const result = await subscribe(input, {
              token: env.NOTION_TOKEN,
              dataSourceId: env.NOTION_SUBSCRIBE_DATA_SOURCE_ID,
              otpSecret: env.OTP_SIGNING_SECRET,
            })
            send(result.status, result.body)
          } catch {
            send(400, { ok: false, error: 'bad_request' })
          }
        })
      }
      server.middlewares.use('/api/subscribe', handler)
    },
  }
}

// 로컬 dev 전용 /api/claim-documents 엔드포인트 (필요서류 조회, GET).
// 사전알람과 별개의 데이터소스(NOTION_DOCS_DATA_SOURCE_ID)를 사용한다.
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

// 로컬 dev 전용 /api/otp-send 엔드포인트 (전화번호 인증코드 발송, POST).
function otpSendApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-otp-send-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 1e5) req.destroy()
        })
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try {
            const input = raw ? JSON.parse(raw) : {}
            const result = await sendOtp(input, {
              signingSecret: env.OTP_SIGNING_SECRET,
              solapiApiKey: env.SOLAPI_API_KEY,
              solapiApiSecret: env.SOLAPI_API_SECRET,
              solapiSenderNumber: env.SOLAPI_SENDER_NUMBER,
            })
            send(result.status, result.body)
          } catch {
            send(400, { ok: false, error: 'bad_request' })
          }
        })
      }
      server.middlewares.use('/api/otp-send', handler)
    },
  }
}

// 로컬 dev 전용 /api/otp-verify 엔드포인트 (전화번호 인증코드 확인, POST).
function otpVerifyApi(env: Record<string, string>): PluginOption {
  return {
    name: 'api-otp-verify-dev',
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        if (req.method !== 'POST') return next()
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk
          if (raw.length > 1e5) req.destroy()
        })
        req.on('end', async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try {
            const input = raw ? JSON.parse(raw) : {}
            const result = verifyOtp(input, { signingSecret: env.OTP_SIGNING_SECRET })
            send(result.status, result.body)
          } catch {
            send(400, { ok: false, error: 'bad_request' })
          }
        })
      }
      server.middlewares.use('/api/otp-verify', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      subscribeApi(env),
      documentsApi(env),
      geminiApi(env),
      otpSendApi(env),
      otpVerifyApi(env),
    ],
  }
})
