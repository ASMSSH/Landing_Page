import { defineConfig, loadEnv, type Connect, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { subscribe } from './server/notion.ts'

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
              dataSourceId: env.NOTION_DATA_SOURCE_ID,
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), subscribeApi(env)],
  }
})
