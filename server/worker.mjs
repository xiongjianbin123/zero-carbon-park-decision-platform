import catalog from '../public/policies/catalog.json' with { type: 'json' }
import index from '../public/policies/index.json' with { type: 'json' }
import { createPolicySearch } from './policySearch.mjs'
import { createWorkspaceRouter } from './workspace/router.mjs'

const SYSTEM_PROMPT = `你是零碳园区政策与项目咨询助手。只能使用用户消息中提供的政策证据和园区数据回答。
要求：
1. 区分真实政策事实与演示园区数据；
2. 证据不足时明确说出缺少哪些数据，不得补写不存在的文号、页码、日期或园区事实；
3. 回答采用“一句结论、关键依据、建议动作”的简洁结构；
4. 每条政策依据必须使用提供的证据编号，例如 [E01]；
5. 不输出内部思考过程。`

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
}

function appError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status })
}

async function readJson(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw appError('INVALID_CONTENT_TYPE', '请求必须使用 application/json。', 415)
  }
  const text = await request.text()
  if (text.length > 64 * 1024) throw appError('REQUEST_TOO_LARGE', '请求内容超过限制。', 413)
  try {
    return JSON.parse(text || '{}')
  } catch {
    throw appError('INVALID_JSON', '请求内容不是有效的 JSON。')
  }
}

function cleanQuestion(value) {
  const question = typeof value === 'string' ? value.trim() : ''
  if (!question || question.length > 1000) throw appError('INVALID_QUESTION', '请输入 1—1000 个字符的问题。')
  return question
}

function renderPrompt({ question, evidence, parkContext }) {
  const sources = evidence.map((item) => [
    `[${item.evidenceId}] ${item.title}${item.page ? ` · ${item.page}` : ''}`,
    item.excerpt,
  ].join('\n')).join('\n\n')
  return `问题：${question}\n\n园区数据（演示口径）：\n${parkContext || '未提供'}\n\n政策证据：\n${sources}`
}

async function answerQuestion({ question, evidence, parkContext, env, fetchImpl }) {
  if (!evidence.length) throw appError('EVIDENCE_NOT_FOUND', '没有检索到足以回答该问题的政策证据。', 422)
  if (!env.MINIMAX_API_KEY) throw appError('MINIMAX_NOT_CONFIGURED', '智能问数尚未完成公网配置。', 503)

  const baseURL = (env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/anthropic').replace(/\/$/, '')
  const response = await fetchImpl(`${baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': env.MINIMAX_API_KEY,
    },
    body: JSON.stringify({
      model: env.MINIMAX_MODEL || 'MiniMax-M3',
      max_tokens: 1200,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: renderPrompt({ question, evidence, parkContext }) }],
    }),
  })
  if (!response.ok) throw appError('MINIMAX_UPSTREAM_ERROR', '智能问数服务暂时不可用，请稍后重试。', 502)

  const payload = await response.json()
  const answer = (payload.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n')
  if (!answer) throw appError('MINIMAX_EMPTY_RESPONSE', '智能问数未返回可展示内容。', 502)

  const citedIds = [...new Set(answer.match(/E\d{2}/g) ?? [])]
  return { answer, citations: evidence.filter((item) => citedIds.includes(item.evidenceId)) }
}

export function createWorkerHandler({ catalog: policyCatalog = catalog, index: policyIndex = index, fetchImpl = fetch, workspaceDeps } = {}) {
  const repository = createPolicySearch({ catalog: policyCatalog, index: policyIndex })
  const workspaceRouter = createWorkspaceRouter(workspaceDeps)

  return async function handle(request, env = {}) {
    const url = new URL(request.url)
    try {
      const workspaceResponse = await workspaceRouter.handle(request, env)
      if (workspaceResponse) return workspaceResponse
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json({ ok: true, policyDocuments: repository.listDocuments().length })
      }
      if (request.method === 'GET' && url.pathname === '/api/policies') {
        return json({ documents: repository.listDocuments() })
      }
      if (request.method === 'POST' && url.pathname === '/api/policies/search') {
        const body = await readJson(request)
        return json({ results: repository.search(cleanQuestion(body.query), body.filters ?? {}, body.limit ?? 6) })
      }
      if (request.method === 'POST' && url.pathname === '/api/qa') {
        const body = await readJson(request)
        const question = cleanQuestion(body.question)
        const evidence = repository.search(question, body.filters ?? {}, 6)
        const parkContext = typeof body.parkContext === 'string' ? body.parkContext.slice(0, 4000) : ''
        return json(await answerQuestion({ question, evidence, parkContext, env, fetchImpl }))
      }
      if (url.pathname.startsWith('/api/')) return json({ code: 'NOT_FOUND', message: '接口不存在。' }, 404)
      if (env.ASSETS?.fetch) return env.ASSETS.fetch(request)
      return new Response('Not Found', { status: 404 })
    } catch (error) {
      return json({ code: error.code ?? 'INTERNAL_ERROR', message: error.code ? error.message : '服务暂时不可用。' }, error.status ?? 500)
    }
  }
}

const handler = createWorkerHandler()

export default {
  fetch(request, env) {
    return handler(request, env)
  },
}
