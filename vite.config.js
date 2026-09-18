import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Serve the generated Experiments pages at their extensionless, permanent URLs.
// Anything that already resolves to a file (/experiments/foo.html, assets) is
// left alone — only the clean URL is rewritten.
const experimentsCleanUrl = (server) => {
  server.middlewares.use((req, res, next) => {
    const url = (req.url || '').split('?')[0]
    if (url === '/experiments' || url === '/experiments/') {
      req.url = '/experiments/index.html'
    } else {
      const slug = url.match(/^\/experiments\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/)
      if (slug) req.url = `/experiments/${slug[1]}.html`
    }
    next()
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  console.log('[vite] API key loaded:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING')

  // Build target: 'public' (default) or 'studio'.
  // Vercel sets BUILD_TARGET via the project's environment variable.
  // The public project builds index.html only — Studio code never enters that bundle.
  const buildTarget = env.BUILD_TARGET || process.env.BUILD_TARGET || 'public'
  const input = buildTarget === 'studio'
    ? { studio: path.resolve(process.cwd(), 'studio.html') }
    : { index: path.resolve(process.cwd(), 'index.html') }

  return {
    build: {
      rollupOptions: { input },
    },
    plugins: [
      react(),
      {
        // Dev-only mirror of the vercel.json rewrite: serve the standalone
        // World Cup Atlas page at the clean URL /world-cup-atlas. Without this,
        // vite's SPA fallback would render the React home page instead.
        name: 'atlas-clean-url',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const path = (req.url || '').split('?')[0]
            if (path === '/world-cup-atlas' || path === '/world-cup-atlas/') {
              req.url = '/world-cup-atlas.html'
            }
            next()
          })
        },
      },
      {
        // Dev/preview mirror of the vercel.json rewrites for the Experiments
        // section: /experiments -> /experiments/index.html and
        // /experiments/<slug> -> /experiments/<slug>.html. The pages themselves
        // are generated into public/experiments by `npm run experiments:build`
        // (wired as predev/prebuild).
        name: 'experiments-clean-url',
        configureServer: experimentsCleanUrl,
        configurePreviewServer: experimentsCleanUrl,
      },
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
