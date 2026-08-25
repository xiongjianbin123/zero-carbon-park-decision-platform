import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPolicySearch } from './policySearch.mjs'

const serverDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(serverDir, '..')

export function createPolicyRepository({
  catalogPath = resolve(projectDir, 'public/policies/catalog.json'),
  indexPath = resolve(projectDir, 'public/policies/index.json'),
  catalog,
  index,
} = {}) {
  return createPolicySearch({
    catalog: catalog ?? JSON.parse(readFileSync(catalogPath, 'utf8')),
    index: index ?? JSON.parse(readFileSync(indexPath, 'utf8')),
  })
}
