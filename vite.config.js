import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Dev-only middleware: lets the in-app developer audit UI write back to
// src/data/categoryTimesAudit.json. Only registered during `vite` (dev),
// never bundled into the production build, never reachable on Vercel.
function auditWriterPlugin() {
  return {
    name: 'audit-writer-dev-only',
    apply: 'serve',
    configureServer(server) {
      const auditPath = resolve(server.config.root, 'src/data/categoryTimesAudit.json')

      server.middlewares.use('/__dev/audit/save', (req, res, next) => {
        if (req.method !== 'POST') {
          // Let other handlers respond if not POST (avoids hijacking sub-paths)
          return next()
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            writeFileSync(auditPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, count: Object.keys(data).length }))
          } catch (e) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: e.message }))
          }
        })
        req.on('error', e => {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: e.message }))
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    auditWriterPlugin(),
  ],
})
