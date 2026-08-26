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
    id: () => `task-id-${++sequence}`,
    now: () => '2026-08-26T07:00:00.000Z',
  } })
  const call = (path, options) => handler(jsonRequest(path, options), env)
  return { env, handler, call }
}

async function createPark(call, name = '任务测试园区') {
  const response = await call('/api/workspace/parks', {
    method: 'POST', user: owner, body: {
      name, region: '山西省大同市', parkType: '工业园区', leadingIndustries: ['新材料'],
      baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区',
    },
  })
  return (await response.json()).park
}

async function createTask(call, parkId, overrides = {}) {
  const response = await call(`/api/workspace/parks/${parkId}/tasks`, {
    method: 'POST', user: owner, body: {
      taskType: '数据补齐', title: '补充企业能耗台账', ownerName: '能源专员',
      plannedDate: '2026-09-30', status: 'open', ...overrides,
    },
  })
  return { response, payload: await response.json() }
}

function evidenceRequest(parkId, taskId, { user = owner, filename = '复核说明.pdf', type = 'application/pdf', contents = '%PDF-1.7 evidence' } = {}) {
  const form = new FormData()
  form.set('ownerType', 'task')
  form.set('ownerId', taskId)
  form.set('file', new File([contents], filename, { type }))
  return new Request(`https://park.example/api/workspace/parks/${parkId}/files`, {
    method: 'POST',
    headers: {
      'oai-authenticated-user-id': user.userId,
      'oai-authenticated-user-email': user.email,
    },
    body: form,
  })
}

test('done requires an evidence file or a nonblank review note', async () => {
  const { call } = app()
  const park = await createPark(call)
  const { payload } = await createTask(call, park.id)
  const task = payload.task

  const denied = await call(`/api/workspace/parks/${park.id}/tasks/${task.id}`, {
    method: 'PATCH', user: owner, body: { status: 'done' },
  })
  const accepted = await call(`/api/workspace/parks/${park.id}/tasks/${task.id}`, {
    method: 'PATCH', user: owner, body: { status: 'done', reviewNote: '已由专业负责人复核。' },
  })

  assert.equal(denied.status, 422)
  assert.equal((await denied.json()).code, 'TASK_EVIDENCE_REQUIRED')
  assert.equal(accepted.status, 200)
  assert.equal((await accepted.json()).task.status, 'done')
})

test('task source must be a gap or missing-data indicator from the same park', async () => {
  const { env, call } = app()
  const first = await createPark(call, '甲园区')
  const second = await createPark(call, '乙园区')
  const timestamp = '2026-08-26T07:00:00.000Z'
  const insert = env.DB.database.prepare(`INSERT INTO indicator_results
    (id, diagnosis_run_id, park_id, indicator_key, indicator_version, current_value, target_value, unit, status, input_import_ids, calculation_note, missing_data, calculated_at)
    VALUES (?, 'run-1', ?, 'green_electricity_share', 'p0.1', 95, 90, '%', ?, '[]', 'fixture', '[]', ?)`)
  insert.run('achieved-indicator', first.id, 'achieved', timestamp)
  insert.run('other-park-gap', second.id, 'gap', timestamp)

  const achieved = await createTask(call, first.id, { sourceIndicatorId: 'achieved-indicator' })
  const crossPark = await createTask(call, first.id, { sourceIndicatorId: 'other-park-gap' })

  assert.equal(achieved.response.status, 422)
  assert.equal(achieved.payload.code, 'INVALID_TASK_SOURCE')
  assert.equal(crossPark.response.status, 422)
  assert.equal(crossPark.payload.code, 'INVALID_TASK_SOURCE')
})

test('task evidence is private, downloadable after membership check, and enables completion', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const task = (await createTask(call, park.id)).payload.task
  const uploaded = await handler(evidenceRequest(park.id, task.id), env)
  const file = (await uploaded.json()).file
  const completed = await call(`/api/workspace/parks/${park.id}/tasks/${task.id}`, {
    method: 'PATCH', user: owner, body: { status: 'done' },
  })
  const downloaded = await handler(jsonRequest(`/api/workspace/parks/${park.id}/files/${file.id}`, { user: owner }), env)

  assert.equal(uploaded.status, 201)
  assert.equal(file.r2Key, undefined)
  assert.equal(completed.status, 200)
  assert.equal(downloaded.status, 200)
  const encodedFilename = downloaded.headers.get('content-disposition').match(/filename\*=UTF-8''(.+)$/)[1]
  assert.equal(decodeURIComponent(encodedFilename), '复核说明.pdf')
  assert.equal(await downloaded.text(), '%PDF-1.7 evidence')
})

test('R2 object is removed when file metadata insert fails', async () => {
  const { env, handler, call } = app()
  const park = await createPark(call)
  const task = (await createTask(call, park.id)).payload.task
  env.DB.failNextRunMatching = /INSERT INTO files/
  const response = await handler(evidenceRequest(park.id, task.id), env)

  assert.equal(response.status, 500)
  assert.equal(env.DB.rows('files').length, 0)
  assert.equal(env.FILES.keys().length, 0)
})

test('viewer cannot upload and a member cannot cross park boundaries to download', async () => {
  const { env, handler, call } = app()
  const first = await createPark(call, '甲园区')
  const second = await createPark(call, '乙园区')
  const task = (await createTask(call, first.id)).payload.task
  const uploaded = await handler(evidenceRequest(first.id, task.id), env)
  const file = (await uploaded.json()).file
  await call(`/api/workspace/parks/${first.id}/members`, {
    method: 'POST', user: owner, body: { email: viewer.email, role: 'viewer' },
  })

  const viewerUpload = await handler(evidenceRequest(first.id, task.id, { user: viewer }), env)
  const crossPark = await handler(jsonRequest(`/api/workspace/parks/${second.id}/files/${file.id}`, { user: owner }), env)

  assert.equal(viewerUpload.status, 403)
  assert.equal(crossPark.status, 404)
})

test('task status audit records before and after values without trusting body identity', async () => {
  const { env, call } = app()
  const park = await createPark(call)
  const task = (await createTask(call, park.id)).payload.task
  await call(`/api/workspace/parks/${park.id}/tasks/${task.id}`, {
    method: 'PATCH', user: owner, body: { status: 'blocked', userId: 'spoofed', role: 'admin' },
  })

  const audit = env.DB.rows('audit_logs').find((row) => row.action === 'task.update')
  assert.match(audit.summary, /"before":"open"/)
  assert.match(audit.summary, /"after":"blocked"/)
  assert.notEqual(audit.user_id, 'spoofed')
})
