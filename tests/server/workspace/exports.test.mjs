import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import test from 'node:test'
import * as XLSX from 'xlsx'
import { createWorkerHandler } from '../../../server/worker.mjs'
import { jsonRequest, workspaceEnv } from './fakes.mjs'

XLSX.set_fs(fs)

const owner = { userId: 'owner-sites-id', email: 'owner@example.test' }
const viewer = { userId: 'viewer-sites-id', email: 'viewer@example.test' }

function app() {
  const env = workspaceEnv()
  let sequence = 0
  const handler = createWorkerHandler({ workspaceDeps: {
    id: () => `export-id-${++sequence}`,
    now: () => '2026-08-26T08:00:00.000Z',
  } })
  const call = (path, options) => handler(jsonRequest(path, options), env)
  return { env, handler, call }
}

async function createPark(call, name = '成果测试园区') {
  const response = await call('/api/workspace/parks', {
    method: 'POST', user: owner, body: {
      name, region: '山西省大同市', parkType: '工业园区', leadingIndustries: ['新材料'],
      baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区',
    },
  })
  return (await response.json()).park
}

async function seedTaskAndDiagnosis(call, parkId) {
  await call(`/api/workspace/parks/${parkId}/diagnosis`, { method: 'POST', user: owner, body: {} })
  await call(`/api/workspace/parks/${parkId}/tasks`, {
    method: 'POST', user: owner, body: {
      taskType: '数据补齐', title: '补充负荷曲线', ownerName: '能源专员',
      plannedDate: '2026-09-30', status: 'open',
    },
  })
}

test('all four deliverables preview before any export record or object is saved', async () => {
  const { env, call } = app()
  const park = await createPark(call)
  await seedTaskAndDiagnosis(call, park.id)

  for (const type of ['diagnosis_report', 'task_register', 'project_investment', 'evidence_catalog']) {
    const response = await call(`/api/workspace/parks/${park.id}/exports`, {
      method: 'POST', user: owner, body: { type, confirmed: false },
    })
    const preview = (await response.json()).preview
    assert.equal(response.status, 200)
    assert.equal(preview.type, type)
    assert.equal(preview.snapshot.park.id, park.id)
    assert.equal(preview.snapshot.indicatorVersion, 'p0.1')
  }
  assert.equal(env.DB.rows('exports').length, 0)
  assert.equal(env.FILES.keys().length, 0)
})

test('confirmed task register is stored in R2 and downloads as a readable workbook', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  await seedTaskAndDiagnosis(call, park.id)
  const confirmed = await call(`/api/workspace/parks/${park.id}/exports`, {
    method: 'POST', user: owner, body: { type: 'task_register', confirmed: true },
  })
  const exported = (await confirmed.json()).export
  const download = await handler(jsonRequest(`/api/workspace/parks/${park.id}/exports/${exported.id}?download=1`, { user: owner }), env)
  const workbook = XLSX.read(await download.arrayBuffer(), { type: 'array' })
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.任务表, { header: 1 })

  assert.equal(confirmed.status, 201)
  assert.equal(download.status, 200)
  assert.equal(download.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  assert.deepEqual(rows[0], ['任务标题', '任务类型', '责任人', '计划日期', '状态', '审核备注', '佐证数量'])
  assert.equal(env.DB.rows('exports').length, 1)
  assert.equal(env.FILES.keys().length, 1)
})

test('confirmed diagnosis report stores a print snapshot without an R2 object', async () => {
  const { env, call } = app()
  const park = await createPark(call)
  await seedTaskAndDiagnosis(call, park.id)
  const confirmed = await call(`/api/workspace/parks/${park.id}/exports`, {
    method: 'POST', user: owner, body: { type: 'diagnosis_report', confirmed: true },
  })
  const exported = (await confirmed.json()).export
  const fetched = await call(`/api/workspace/parks/${park.id}/exports/${exported.id}`, { user: owner })
  const payload = (await fetched.json()).export

  assert.equal(confirmed.status, 201)
  assert.equal(payload.snapshot.park.name, '成果测试园区')
  assert.equal(payload.downloadAvailable, false)
  assert.equal(env.FILES.keys().length, 0)
})

test('viewer cannot generate exports and a different park cannot fetch one', async () => {
  const { call } = app()
  const first = await createPark(call, '甲园区')
  const second = await createPark(call, '乙园区')
  await seedTaskAndDiagnosis(call, first.id)
  await call(`/api/workspace/parks/${first.id}/members`, {
    method: 'POST', user: owner, body: { email: viewer.email, role: 'viewer' },
  })
  const denied = await call(`/api/workspace/parks/${first.id}/exports`, {
    method: 'POST', user: viewer, body: { type: 'task_register', confirmed: true },
  })
  const confirmed = await call(`/api/workspace/parks/${first.id}/exports`, {
    method: 'POST', user: owner, body: { type: 'task_register', confirmed: true },
  })
  const exported = (await confirmed.json()).export
  const crossPark = await call(`/api/workspace/parks/${second.id}/exports/${exported.id}`, { user: owner })

  assert.equal(denied.status, 403)
  assert.equal(crossPark.status, 404)
})

test('R2 failure does not leave a successful export row', async () => {
  const { env, call } = app()
  const park = await createPark(call)
  await seedTaskAndDiagnosis(call, park.id)
  env.FILES.failNextPut = true
  const response = await call(`/api/workspace/parks/${park.id}/exports`, {
    method: 'POST', user: owner, body: { type: 'task_register', confirmed: true },
  })

  assert.equal(response.status, 500)
  assert.equal(env.DB.rows('exports').length, 0)
  assert.equal(env.FILES.keys().length, 0)
})

