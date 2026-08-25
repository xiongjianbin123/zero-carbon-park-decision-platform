import assert from 'node:assert/strict'
import test from 'node:test'
import { createMinimaxClient } from '../../server/minimaxClient.mjs'

const evidence = [{
  evidenceId: 'E01',
  documentId: 'indicator',
  title: '国家级零碳园区建设指标体系（试行）',
  page: 'P.1',
  sourceUrl: 'https://example.gov.cn/indicator.pdf',
  excerpt: '清洁能源消费占比不低于90%。',
}]

test('refuses to answer without retrieved evidence', async () => {
  const client = createMinimaxClient({ apiKey: 'test', client: { messages: { create: async () => ({ content: [] }) } } })

  await assert.rejects(
    () => client.answerQuestion({ question: '怎么申报', evidence: [], parkContext: '' }),
    (error) => error.code === 'EVIDENCE_NOT_FOUND',
  )
})

test('returns only citations present in retrieved evidence', async () => {
  const fakeSdk = {
    messages: {
      create: async () => ({
        content: [{ type: 'thinking', thinking: 'internal' }, { type: 'text', text: '当前为43%，与门槛仍有差距。[E01][E99]' }],
      }),
    },
  }
  const answer = await createMinimaxClient({ apiKey: 'test', client: fakeSdk }).answerQuestion({
    question: '清洁能源门槛是多少',
    evidence,
    parkContext: '园区演示数据：当前清洁能源消费占比43%。',
  })

  assert.equal(answer.answer, '当前为43%，与门槛仍有差距。[E01][E99]')
  assert.deepEqual(answer.citations.map((item) => item.evidenceId), ['E01'])
})

test('does not call the model when no Token Plan key is configured', async () => {
  const client = createMinimaxClient({ apiKey: '' })

  await assert.rejects(
    () => client.answerQuestion({ question: '门槛是多少', evidence, parkContext: '' }),
    (error) => error.code === 'MINIMAX_NOT_CONFIGURED',
  )
})
