import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { createAppServer } from '../../server/index.mjs'

async function startServer({ qaError } = {}) {
  const repository = {
    listDocuments: () => [{ id: 'policy-1', title: '政策一' }],
    search: () => [{
      evidenceId: 'E01', documentId: 'policy-1', title: '政策一', page: 'P.1',
      sourceUrl: 'https://example.gov.cn/policy', excerpt: '绿电直连支持园区。',
    }],
  }
  const qaClient = {
    answerQuestion: async () => {
      if (qaError) throw qaError
      return { answer: '可开展绿电直连。[E01]', citations: repository.search() }
    },
  }
  const server = createAppServer({ repository, qaClient, distDir: '/path/that/does/not/exist' })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  return { server, url: `http://127.0.0.1:${address.port}` }
}

test('POST /api/policies/search returns traceable evidence', async (context) => {
  const app = await startServer()
  context.after(() => app.server.close())

  const response = await fetch(`${app.url}/api/policies/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '绿电直连' }),
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.results[0].evidenceId, 'E01')
})

test('POST /api/qa maps an unconfigured key to a stable error', async (context) => {
  const error = new Error('not configured')
  error.code = 'MINIMAX_NOT_CONFIGURED'
  const app = await startServer({ qaError: error })
  context.after(() => app.server.close())

  const response = await fetch(`${app.url}/api/qa`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: '怎么申报' }),
  })
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.code, 'MINIMAX_NOT_CONFIGURED')
})

test('rejects an empty question before retrieval', async (context) => {
  const app = await startServer()
  context.after(() => app.server.close())

  const response = await fetch(`${app.url}/api/qa`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: '  ' }),
  })

  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'INVALID_QUESTION')
})
