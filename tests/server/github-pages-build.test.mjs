import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const projectRoot = new URL('../../', import.meta.url)
const clientRoot = new URL('../../dist/client/', import.meta.url)

test('GitHub Pages build emits a self-contained client for a repository subpath', async () => {
  await execFileAsync('npm', ['run', 'build:pages'], {
    cwd: projectRoot,
    env: process.env,
  })

  const indexUrl = new URL('index.html', clientRoot)
  const html = await readFile(indexUrl, 'utf8')
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.includes('assets/'))

  assert.ok(assetPaths.length >= 2)
  assert.equal(assetPaths.some((path) => path.startsWith('/')), false)
  await Promise.all(assetPaths.map((path) => access(new URL(path, indexUrl))))
  await assert.doesNotReject(access(new URL('.nojekyll', clientRoot)))
})
