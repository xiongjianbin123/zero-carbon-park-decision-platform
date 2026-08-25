import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import test from 'node:test'

test('deployment build includes both the client entry and Worker entry', async () => {
  await assert.doesNotReject(access(new URL('../../dist/client/index.html', import.meta.url)))
  await assert.doesNotReject(access(new URL('../../dist/server/index.js', import.meta.url)))
  await assert.doesNotReject(access(new URL('../../dist/server/wrangler.json', import.meta.url)))
})

test('deployment build does not retain the legacy root client output', async () => {
  await assert.rejects(
    access(new URL('../../dist/index.html', import.meta.url)),
    { code: 'ENOENT' },
  )
})

test('deployment build never contains the local environment snapshot', async () => {
  await assert.rejects(
    access(new URL('../../dist/server/.dev.vars', import.meta.url)),
    { code: 'ENOENT' },
  )
})
