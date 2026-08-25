import assert from 'node:assert/strict'
import test from 'node:test'
import { createPolicyRepository } from '../../server/policyRepository.mjs'

test('search ranks the national trial indicator for its exact indicator phrase', () => {
  const results = createPolicyRepository().search('清洁能源消费占比', {}, 3)

  assert.equal(results[0].documentId, 'national-zero-carbon-indicators-trial')
  assert.match(results[0].excerpt, /清洁能源消费占比/)
  assert.equal(results[0].evidenceId, 'E01')
})

test('search finds official green direct connection evidence', () => {
  const results = createPolicyRepository().search('绿电直连', {}, 5)

  assert.ok(results.length > 0)
  assert.ok(results.some((item) => item.documentId === 'nea-multi-user-green-direct'))
  assert.ok(results.every((item) => item.sourceUrl.startsWith('https://')))
})

test('search limits results to drafting standards when requested', () => {
  const results = createPolicyRepository().search('零碳园区', { statuses: ['drafting'] }, 10)

  assert.ok(results.length > 0)
  assert.ok(results.every((item) => item.status === 'drafting'))
})

test('search returns no evidence for an empty question', () => {
  assert.deepEqual(createPolicyRepository().search('   '), [])
})
