import { cp, mkdir, readdir, rm } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const files = await readdir(dist, { recursive: true })
await Promise.all(files
  .filter((file) => file.endsWith('.dev.vars') || file.endsWith('.env.local'))
  .map((file) => rm(new URL(file, dist), { force: true })))

const migrationTarget = new URL('../dist/.openai/drizzle/', import.meta.url)
await mkdir(migrationTarget, { recursive: true })
await cp(new URL('../drizzle/', import.meta.url), migrationTarget, { recursive: true })
