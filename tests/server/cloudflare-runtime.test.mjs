import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import workerdPackage from 'workerd/package.json' with { type: 'json' }

test('Worker compatibility date does not exceed the installed runtime', async () => {
  const source = await readFile(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
  const configured = source.match(/"compatibility_date"\s*:\s*"(\d{4})-(\d{2})-(\d{2})"/)
  assert.ok(configured, 'wrangler.jsonc must define compatibility_date')

  const runtime = workerdPackage.version.match(/^\d+\.(\d{4})(\d{2})(\d{2})\./)
  assert.ok(runtime, `unexpected workerd version: ${workerdPackage.version}`)

  const configuredDate = Number(`${configured[1]}${configured[2]}${configured[3]}`)
  const runtimeDate = Number(`${runtime[1]}${runtime[2]}${runtime[3]}`)
  assert.ok(
    configuredDate <= runtimeDate,
    `compatibility date ${configured.slice(1).join('-')} exceeds workerd ${workerdPackage.version}`,
  )
})

