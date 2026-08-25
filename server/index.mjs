#!/usr/bin/env node
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMinimaxClient } from './minimaxClient.mjs'
import { createPolicyRepository } from './policyRepository.mjs'

const serverDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(serverDir, '..')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function appError(code, message, status = 400) {
  const error = new Error(message)
  error.code = code
  error.status = status
  return error
}

async function readJson(request) {
  if (!request.headers['content-type']?.includes('application/json')) {
    throw appError('INVALID_CONTENT_TYPE', '请求必须使用 application/json。', 415)
  }
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 64 * 1024) throw appError('REQUEST_TOO_LARGE', '请求内容超过限制。', 413)
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
  } catch {
    throw appError('INVALID_JSON', '请求内容不是有效的 JSON。')
  }
}

function cleanQuestion(value) {
  const question = typeof value === 'string' ? value.trim() : ''
  if (!question || question.length > 1000) {
    throw appError('INVALID_QUESTION', '请输入 1—1000 个字符的问题。')
  }
  return question
}

function errorStatus(error) {
  if (error.status) return error.status
  if (error.code === 'MINIMAX_NOT_CONFIGURED') return 503
  if (error.code === 'EVIDENCE_NOT_FOUND') return 422
  if (String(error.code).startsWith('MINIMAX_')) return 502
  return 500
}

function serveStatic(requestPath, response, distDir) {
  let pathname
  try {
    pathname = decodeURIComponent(requestPath)
  } catch {
    response.writeHead(400).end('Bad Request')
    return
  }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const filePath = resolve(distDir, relativePath)
  if (!filePath.startsWith(`${resolve(distDir)}${sep}`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
    return
  }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' })
  createReadStream(filePath).pipe(response)
}

export function createAppServer({
  repository = createPolicyRepository(),
  qaClient = createMinimaxClient(),
  distDir = resolve(projectDir, 'dist'),
} = {}) {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        sendJson(response, 200, { ok: true, policyDocuments: repository.listDocuments().length })
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/policies') {
        sendJson(response, 200, { documents: repository.listDocuments() })
        return
      }
      if (request.method === 'POST' && url.pathname === '/api/policies/search') {
        const body = await readJson(request)
        const query = cleanQuestion(body.query)
        sendJson(response, 200, { results: repository.search(query, body.filters ?? {}, body.limit ?? 6) })
        return
      }
      if (request.method === 'POST' && url.pathname === '/api/qa') {
        const body = await readJson(request)
        const question = cleanQuestion(body.question)
        const evidence = repository.search(question, body.filters ?? {}, 6)
        const parkContext = typeof body.parkContext === 'string' ? body.parkContext.slice(0, 4000) : ''
        sendJson(response, 200, await qaClient.answerQuestion({ question, evidence, parkContext }))
        return
      }
      if (url.pathname.startsWith('/api/')) {
        sendJson(response, 404, { code: 'NOT_FOUND', message: '接口不存在。' })
        return
      }
      serveStatic(url.pathname, response, distDir)
    } catch (error) {
      sendJson(response, errorStatus(error), {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.status || error.code ? error.message : '服务暂时不可用。',
      })
    }
  })
}

export function loadLocalEnv(path = resolve(projectDir, '.env.local')) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (!match || process.env[match[1]] !== undefined) continue
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadLocalEnv()
  const port = Number(process.env.PORT ?? 4174)
  const server = createAppServer()
  server.listen(port, '127.0.0.1', () => {
    console.log(`零碳园区平台已启动：http://127.0.0.1:${port}`)
  })
}
