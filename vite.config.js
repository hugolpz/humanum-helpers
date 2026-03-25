import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

// Ensure sparql/ and data/ directories exist
const sparqlDir = path.resolve(__dirname, 'sparql')
const dataDir   = path.resolve(__dirname, 'data')
if (!fs.existsSync(sparqlDir)) fs.mkdirSync(sparqlDir, { recursive: true })
if (!fs.existsSync(dataDir))   fs.mkdirSync(dataDir,   { recursive: true })

function sparqlApiPlugin() {
  return {
    name: 'sparql-api',
    configureServer(server) {
      server.middlewares.use('/api/save-query', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { filename, content } = JSON.parse(body)
            if (!filename || /[/\\]/.test(filename)) {
              res.statusCode = 400
              return res.end(JSON.stringify({ error: 'Invalid filename' }))
            }
            const safe = filename.replace(/\.sparql$/, '')
            const filePath = path.join(sparqlDir, `${safe}.sparql`)
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, file: `${safe}.sparql` }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      server.middlewares.use('/api/list-queries', (req, res, next) => {
        if (req.method !== 'GET') return next()
        try {
          const files = fs.readdirSync(sparqlDir)
            .filter(f => f.endsWith('.sparql'))
            .map(f => ({
              name: f,
              title: f.replace(/\.sparql$/, ''),
              mtime: fs.statSync(path.join(sparqlDir, f)).mtimeMs
            }))
            .sort((a, b) => b.mtime - a.mtime)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(files))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })

      server.middlewares.use('/api/get-query', (req, res, next) => {
        if (req.method !== 'GET') return next()
        const filename = decodeURIComponent(req.url.replace(/^\//, ''))
        if (!filename || /[/\\]/.test(filename)) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Invalid filename' }))
        }
        const filePath = path.join(sparqlDir, filename)
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          return res.end(JSON.stringify({ error: 'Not found' }))
        }
        const content = fs.readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ content }))
      })
    }
  }
}

export default defineConfig({
  base: '/humanum-helpers/',
  plugins: [vue(), sparqlApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
