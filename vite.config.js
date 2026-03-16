import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  console.log('[vite] API key loaded:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING')
  return {
    plugins: [
      react(),
      {
        name: 'api-generate',
        configureServer(server) {
          server.middlewares.use('/api/generate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            // Read key fresh from .env each time
            let key = apiKey
            try {
              const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8')
              const m = envFile.match(/ANTHROPIC_API_KEY=(.+)/)
              if (m) key = m[1].trim()
            } catch {}
            console.log('[api/generate] using key:', key ? key.substring(0, 15) + '...' : 'MISSING')
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                  },
                  body,
                })
                const data = await response.text()
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = response.status
                res.end(data)
              } catch (e) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: { message: e.message } }))
              }
            })
          })
        },
      },
    ],
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', apiKey)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
            })
          },
        },
      },
    },
  }
})
