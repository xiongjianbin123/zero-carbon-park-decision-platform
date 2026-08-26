import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorkerHandler } from '../../../server/worker.mjs'
import { jsonRequest, workspaceEnv } from './fakes.mjs'

const owner = { userId: 'owner-sites-id', email: 'owner@example.test' }
const viewer = { userId: 'viewer-sites-id', email: 'viewer@example.test' }

function app() {
  const env = workspaceEnv()
  let sequence = 0
  const handler = createWorkerHandler({ workspaceDeps: {
    id: () => `import-id-${++sequence}`,
    now: () => '2026-08-26T05:00:00.000Z',
  } })
  const call = (path, options) => handler(jsonRequest(path, options), env)
  return { env, handler, call }
}

async function createPark(call, name = '导入测试园区') {
  const response = await call('/api/workspace/parks', {
    method: 'POST',
    user: owner,
    body: {
      name,
      region: '山西省大同市',
      parkType: '资源型工业园区',
      leadingIndustries: ['新材料'],
      baselineYear: 2025,
      targetYear: 2030,
      applicationDirection: '国家级零碳园区',
    },
  })
  return (await response.json()).park
}

function importRequest(parkId, csv, { user = owner, filename = 'monthly.csv', kind = 'energy_monthly', replaceImportId } = {}) {
  const form = new FormData()
  form.set('kind', kind)
  form.set('metadata', JSON.stringify({ replaceImportId }))
  form.set('file', new File([csv], filename, { type: 'text/csv' }))
  return new Request(`https://park.example/api/workspace/parks/${parkId}/imports`, {
    method: 'POST',
    headers: {
      'oai-authenticated-user-id': user.userId,
      'oai-authenticated-user-email': user.email,
    },
    body: form,
  })
}

const validMonthlyCsv = '月份,用电量kWh,电费元,绿电电量kWh\n2026-01,120000,78000,60000\n'

test('valid original file is revalidated then stored in R2 and normalized into D1', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const response = await handler(importRequest(park.id, validMonthlyCsv), env)
  const payload = await response.json()

  assert.equal(response.status, 201)
  assert.equal(payload.importBatch.status, 'succeeded')
  assert.equal(payload.importBatch.acceptedRows, 1)
  assert.equal(env.DB.rows('energy_monthly')[0].electricity_kwh, 120000)
  assert.match(env.FILES.keys()[0], new RegExp(`^parks/${park.id}/imports/${payload.importBatch.id}/monthly.csv$`))

  const listed = await handler(jsonRequest(`/api/workspace/parks/${park.id}/imports`, { user: owner }), env)
  assert.equal((await listed.json()).imports.length, 1)
})

test('negative source values are rejected before either store is written', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const response = await handler(importRequest(park.id, '月份,用电量kWh,电费元\n2026-01,-1,20\n'), env)

  assert.equal(response.status, 422)
  assert.equal((await response.json()).code, 'IMPORT_VALIDATION_FAILED')
  assert.equal(env.DB.rows('imports').length, 0)
  assert.equal(env.FILES.keys().length, 0)
  assert.equal(env.DB.rows('audit_logs').at(-1).result, 'failed')
  assert.equal(env.DB.rows('audit_logs').at(-1).action, 'import.commit')
})

test('same park kind and file digest requires explicit replacement', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const first = await handler(importRequest(park.id, validMonthlyCsv), env)
  const firstBatch = (await first.json()).importBatch
  const duplicate = await handler(importRequest(park.id, validMonthlyCsv), env)
  const replacement = await handler(importRequest(park.id, validMonthlyCsv, { replaceImportId: firstBatch.id }), env)

  assert.equal(duplicate.status, 409)
  assert.equal((await duplicate.json()).code, 'DUPLICATE_IMPORT')
  assert.equal(replacement.status, 201)
  assert.equal(env.DB.rows('imports').filter((row) => row.status === 'succeeded').length, 1)
  assert.equal(env.DB.rows('energy_monthly').length, 1)
  assert.equal(env.FILES.keys().length, 1)
})

test('D1 batch failure removes pending metadata normalized rows and R2 original', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  env.DB.failNextBatch = true
  const response = await handler(importRequest(park.id, validMonthlyCsv), env)

  assert.equal(response.status, 500)
  assert.equal(env.DB.rows('imports').length, 0)
  assert.equal(env.DB.rows('energy_monthly').length, 0)
  assert.equal(env.FILES.keys().length, 0)
  assert.equal(env.DB.rows('audit_logs').at(-1).result, 'failed')
})

test('viewer cannot import and cannot smuggle another user or park in metadata', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  await call(`/api/workspace/parks/${park.id}/members`, {
    method: 'POST', user: owner, body: { email: viewer.email, role: 'viewer' },
  })

  const response = await handler(importRequest(park.id, validMonthlyCsv, { user: viewer }), env)

  assert.equal(response.status, 403)
  assert.equal((await response.json()).code, 'PARK_ACCESS_DENIED')
  assert.equal(env.DB.rows('imports').length, 0)
})
