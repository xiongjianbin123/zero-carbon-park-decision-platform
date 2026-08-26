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
    id: () => `diagnosis-id-${++sequence}`,
    now: () => '2026-08-26T06:00:00.000Z',
  } })
  const call = (path, options) => handler(jsonRequest(path, options), env)
  return { env, handler, call }
}

async function createPark(call) {
  const response = await call('/api/workspace/parks', {
    method: 'POST', user: owner, body: {
      name: '诊断测试园区', region: '山西省大同市', parkType: '工业园区',
      leadingIndustries: ['新材料'], baselineYear: 2025, targetYear: 2030,
      applicationDirection: '国家级零碳园区',
    },
  })
  return (await response.json()).park
}

function monthlyImportRequest(parkId) {
  const form = new FormData()
  form.set('kind', 'energy_monthly')
  form.set('metadata', '{}')
  form.set('file', new File([
    '月份,用电量kWh,电费元,绿电电量kWh\n2026-01,1000,600,500\n',
  ], 'monthly.csv', { type: 'text/csv' }))
  return new Request(`https://park.example/api/workspace/parks/${parkId}/imports`, {
    method: 'POST',
    headers: {
      'oai-authenticated-user-id': owner.userId,
      'oai-authenticated-user-email': owner.email,
    },
    body: form,
  })
}

test('diagnosis stores formula trace input batches and explicit missing data', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const imported = await handler(monthlyImportRequest(park.id), env)
  const importBatch = (await imported.json()).importBatch
  const response = await call(`/api/workspace/parks/${park.id}/diagnosis`, { method: 'POST', user: owner, body: {} })
  const diagnosis = (await response.json()).diagnosis

  assert.equal(response.status, 201)
  assert.equal(diagnosis.version, 'p0.1')
  assert.equal(diagnosis.dataBaselineDate, '2026-01')
  assert.equal(diagnosis.results.find((item) => item.key === 'green_electricity_share').currentValue, 50)
  assert.equal(diagnosis.results.find((item) => item.key === 'green_electricity_share').status, 'gap')
  assert.deepEqual(diagnosis.results.find((item) => item.key === 'green_electricity_share').inputImportIds, [importBatch.id])
  assert.equal(diagnosis.results.find((item) => item.key === 'load_peak_valley_ratio').status, 'missing_data')
  assert.ok(diagnosis.missingData.includes('load_curve'))
})

test('new diagnosis appends history and latest returns the newest run', async () => {
  const { env, call } = app()
  const park = await createPark(call)
  const first = await call(`/api/workspace/parks/${park.id}/diagnosis`, { method: 'POST', user: owner, body: {} })
  const second = await call(`/api/workspace/parks/${park.id}/diagnosis`, { method: 'POST', user: owner, body: {} })
  const firstRun = (await first.json()).diagnosis.runId
  const secondRun = (await second.json()).diagnosis.runId
  const latest = await call(`/api/workspace/parks/${park.id}/diagnosis/latest`, { user: owner })

  assert.notEqual(firstRun, secondRun)
  assert.equal(env.DB.rows('indicator_results').length, 12)
  assert.equal((await latest.json()).diagnosis.runId, secondRun)
})

test('viewer can read latest diagnosis but cannot generate a new run', async () => {
  const { call } = app()
  const park = await createPark(call)
  await call(`/api/workspace/parks/${park.id}/members`, {
    method: 'POST', user: owner, body: { email: viewer.email, role: 'viewer' },
  })
  await call(`/api/workspace/parks/${park.id}/diagnosis`, { method: 'POST', user: owner, body: {} })

  const denied = await call(`/api/workspace/parks/${park.id}/diagnosis`, { method: 'POST', user: viewer, body: {} })
  const allowed = await call(`/api/workspace/parks/${park.id}/diagnosis/latest`, { user: viewer })

  assert.equal(denied.status, 403)
  assert.equal(allowed.status, 200)
})

