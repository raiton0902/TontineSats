import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { initDb } from '../db/index.js'
import { createApiApp } from './app.js'
import { startScheduler } from './scheduler.js'

const PORT = Number(process.env.PORT ?? 3001)
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const INDEX_HTML = path.join(DIST_DIR, 'index.html')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

async function main() {
  await initDb()
  const app = createApiApp()

  if (existsSync(INDEX_HTML)) {
    app.get('*', (c) => {
      const reqPath = c.req.path === '/' ? '/index.html' : c.req.path
      const resolved = path.resolve(DIST_DIR, reqPath.replace(/^\/+/, ''))
      if (
        resolved.startsWith(DIST_DIR) &&
        existsSync(resolved) &&
        statSync(resolved).isFile()
      ) {
        const ext = path.extname(resolved).toLowerCase()
        const body = readFileSync(resolved)
        return c.body(body, 200, {
          'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
        })
      }
      const html = readFileSync(INDEX_HTML, 'utf-8')
      return c.html(html)
    })
  }

  startScheduler()

  serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
    console.log(`TontineSats API & server listening on http://localhost:${info.port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
