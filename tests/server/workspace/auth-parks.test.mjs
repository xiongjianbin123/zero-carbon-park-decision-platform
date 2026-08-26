import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorkerHandler } from '../../../server/worker.mjs'
import { jsonRequest, workspaceEnv } from './fakes.mjs'

const owner = { userId: 'owner-sites-id', email: 'owner@example.test' }
const outsider = { userId: 'outsider-sites-id', email: 'outsider@example.test' }
const manager = { userId: 'manager-sites-id', email: 'manager@example.test' }
const viewer = { userId: 'viewer-sites-id', email: 'viewer@example.test' }

function testApp() {
  const env = workspaceEnv()
  let sequence = 0
  const handler = createWorkerHandler({
    workspaceDeps: {
      id: () => `id-${++sequence}`,
      now: () => '2026-08-26T04:00:00.000Z',
    },
  })
  const call = (path, options) => handler(jsonRequest(path, options), env)
  return { env, call }
}

const parkInput = (name) => ({
  name,
  region: '山西省大同市',
  parkType: '资源型工业园区',
  leadingIndustries: ['煤化工', '新材料'],
  baselineYear: 2025,
  targetYear: 2030,
  applicationDirection: '国家级零碳园区',
})

async function body(response) {
  return response.json()
}

test('anonymous and uninvited identities cannot list real parks', async () => {
  const { call } = testApp()
  const anonymous = await call('/api/workspace/parks')
  const uninvited = await call('/api/workspace/parks', { user: outsider })

  assert.equal(anonymous.status, 401)
  assert.deepEqual(await body(anonymous), { code: 'AUTH_REQUIRED', message: '请先登录项目工作台。' })
  assert.equal(uninvited.status, 403)
  assert.equal((await body(uninvited)).code, 'WORKSPACE_ACCESS_DENIED')
})

test('explicit owner can create two empty parks and list both', async () => {
  const { call, env } = testApp()
  const first = await call('/api/workspace/parks', { method: 'POST', user: owner, body: parkInput('甲园区') })
  const second = await call('/api/workspace/parks', { method: 'POST', user: owner, body: parkInput('乙园区') })
  const listed = await call('/api/workspace/parks', { user: owner })

  assert.equal(first.status, 201)
  assert.equal(second.status, 201)
  const parks = (await body(listed)).parks
  assert.deepEqual(new Set(parks.map((park) => park.name)), new Set(['甲园区', '乙园区']))
  assert.ok(parks.every((park) => park.role === 'admin'))
  assert.equal(env.DB.rows('energy_monthly').length, 0)
  assert.equal(env.DB.rows('park_projects').length, 0)
})

test('email invitation binds the first trusted login and does not cross park boundaries', async () => {
  const { call } = testApp()
  const first = await body(await call('/api/workspace/parks', { method: 'POST', user: owner, body: parkInput('甲园区') }))
  const second = await body(await call('/api/workspace/parks', { method: 'POST', user: owner, body: parkInput('乙园区') }))
  const invitation = await call(`/api/workspace/parks/${first.park.id}/members`, {
    method: 'POST', user: owner, body: { email: manager.email, role: 'manager' },
  })
  assert.equal(invitation.status, 201)

  const allowed = await call(`/api/workspace/parks/${first.park.id}`, { user: manager })
  const denied = await call(`/api/workspace/parks/${second.park.id}`, { user: manager })
  const listed = await call('/api/workspace/parks', { user: manager })

  assert.equal(allowed.status, 200)
  assert.equal(denied.status, 403)
  assert.deepEqual((await body(listed)).parks.map((park) => park.name), ['甲园区'])
})

test('viewer cannot edit a park even when the UI payload claims admin', async () => {
  const { call } = testApp()
  const created = await body(await call('/api/workspace/parks', { method: 'POST', user: owner, body: parkInput('甲园区') }))
  await call(`/api/workspace/parks/${created.park.id}/members`, {
    method: 'POST', user: owner, body: { email: viewer.email, role: 'viewer' },
  })

  const response = await call(`/api/workspace/parks/${created.park.id}`, {
    method: 'PATCH',
    user: viewer,
    body: { name: '越权改名', role: 'admin', userId: owner.userId },
  })

  assert.equal(response.status, 403)
  assert.equal((await body(response)).code, 'PARK_ACCESS_DENIED')
})

test('development identity headers are accepted only on loopback when explicitly enabled', async () => {
  const { env, call } = testApp()
  env.DEV_AUTH_ENABLED = 'true'
  const publicRequest = new Request('https://park.example/api/workspace/parks', {
    headers: { 'x-dev-user-id': owner.userId, 'x-dev-user-email': owner.email },
  })
  const publicResponse = await createWorkerHandler()(publicRequest, env)

  const loopbackRequest = new Request('http://127.0.0.1:4173/api/workspace/parks', {
    headers: { 'x-dev-user-id': owner.userId, 'x-dev-user-email': owner.email },
  })
  const loopbackResponse = await createWorkerHandler()(loopbackRequest, env)

  assert.equal(publicResponse.status, 401)
  assert.equal(loopbackResponse.status, 200)
})
