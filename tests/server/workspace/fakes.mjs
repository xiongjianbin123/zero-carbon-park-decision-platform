import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

class FakeD1Statement {
  constructor(owner, sql, params = []) {
    this.owner = owner
    this.sql = sql
    this.params = params
  }

  bind(...params) {
    return new FakeD1Statement(this.owner, this.sql, params)
  }

  async first(column) {
    const row = this.owner.database.prepare(this.sql).get(...this.params) ?? null
    return column && row ? row[column] : row
  }

  async all() {
    return { results: this.owner.database.prepare(this.sql).all(...this.params), success: true }
  }

  async run() {
    if (this.owner.failNextRunMatching?.test(this.sql)) {
      this.owner.failNextRunMatching = null
      throw new Error('injected D1 statement failure')
    }
    const result = this.owner.database.prepare(this.sql).run(...this.params)
    return { success: true, meta: { changes: result.changes, last_row_id: result.lastInsertRowid } }
  }
}

export class FakeD1 {
  constructor() {
    this.database = new DatabaseSync(':memory:')
    this.database.exec('PRAGMA foreign_keys = ON')
    this.database.exec(readFileSync(new URL('../../../drizzle/0001_project_workbench.sql', import.meta.url), 'utf8'))
    this.failNextBatch = false
    this.failNextRunMatching = null
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql)
  }

  async batch(statements) {
    if (this.failNextBatch) {
      this.failNextBatch = false
      throw new Error('injected D1 batch failure')
    }
    this.database.exec('BEGIN')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.database.exec('COMMIT')
      return results
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  rows(table) {
    return this.database.prepare(`SELECT * FROM ${table}`).all()
  }
}

export class FakeR2 {
  #objects = new Map()

  async put(key, value, options = {}) {
    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value
    this.#objects.set(key, { bytes, httpMetadata: options.httpMetadata, customMetadata: options.customMetadata })
    return { key }
  }

  async get(key) {
    const object = this.#objects.get(key)
    if (!object) return null
    return {
      key,
      size: object.bytes.byteLength,
      httpMetadata: object.httpMetadata,
      body: object.bytes,
      arrayBuffer: async () => object.bytes.buffer.slice(object.bytes.byteOffset, object.bytes.byteOffset + object.bytes.byteLength),
    }
  }

  async delete(key) {
    this.#objects.delete(key)
  }

  keys() {
    return [...this.#objects.keys()]
  }
}

export function workspaceEnv(overrides = {}) {
  return {
    DB: new FakeD1(),
    FILES: new FakeR2(),
    WORKSPACE_OWNER_USER_ID: 'owner-sites-id',
    WORKSPACE_OWNER_EMAIL: 'owner@example.test',
    ...overrides,
  }
}

export function identityHeaders(userId, email) {
  return {
    'oai-authenticated-user-id': userId,
    'oai-authenticated-user-email': email,
  }
}

export function jsonRequest(path, { method = 'GET', user, body, origin = 'https://park.example' } = {}) {
  const headers = new Headers()
  if (user) {
    headers.set('oai-authenticated-user-id', user.userId)
    headers.set('oai-authenticated-user-email', user.email)
  }
  if (body !== undefined) headers.set('content-type', 'application/json')
  return new Request(`${origin}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
