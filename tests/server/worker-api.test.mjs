import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorkerHandler } from '../../server/worker.mjs'

const catalog = [{
  id: 'policy-1',
  title: '零碳园区指标体系',
  documentNumber: '发改环资〔2025〕910号',
  level: 'national',
  category: 'indicator',
  status: 'effective',
  issuers: ['国家发展改革委'],
  tags: ['零碳园区', '清洁能源'],
  summary: '建立清洁能源消费比例指标。',
  publishedAt: '2025-06-30',
  sourceUrl: 'https://example.com/policy-1',
}]

const index = { chunks: [{
  chunkId: 'policy-1-page-1',
  documentId: 'policy-1',
  page: 1,
  text: '零碳园区应提高清洁能源消费比例。',
}] }

test('worker serves policy search and evidence-backed MiniMax answers', async () => {
  const upstreamCalls = []
  const handler = createWorkerHandler({
    catalog,
    index,
    fetchImpl: async (url, init) => {
      upstreamCalls.push({ url, init })
      return Response.json({ content: [{ type: 'text', text: '可优先提升清洁能源消费比例。[E01]' }] })
    },
  })
  const env = {
    MINIMAX_API_KEY: 'test-key',
    MINIMAX_BASE_URL: 'https://api.minimaxi.com/anthropic',
    MINIMAX_MODEL: 'MiniMax-M3',
  }

  const searchResponse = await handler(new Request('https://park.example/api/policies/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '清洁能源消费比例' }),
  }), env)
  assert.equal(searchResponse.status, 200)
  assert.equal((await searchResponse.json()).results[0].evidenceId, 'E01')

  const qaResponse = await handler(new Request('https://park.example/api/qa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: '园区应如何提升清洁能源比例？' }),
  }), env)
  const answer = await qaResponse.json()

  assert.equal(qaResponse.status, 200)
  assert.equal(answer.citations[0].evidenceId, 'E01')
  assert.equal(upstreamCalls.length, 1)
  assert.equal(upstreamCalls[0].url, 'https://api.minimaxi.com/anthropic/v1/messages')
  assert.equal(upstreamCalls[0].init.headers['x-api-key'], 'test-key')
})

test('worker delegates non-API routes to the static asset binding', async () => {
  const handler = createWorkerHandler({ catalog, index })
  const response = await handler(new Request('https://park.example/'), {
    ASSETS: { fetch: async () => new Response('<main>park</main>', { headers: { 'content-type': 'text/html' } }) },
  })

  assert.equal(response.status, 200)
  assert.equal(await response.text(), '<main>park</main>')
})
