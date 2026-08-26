import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

const expectedTables = [
  'audit_logs',
  'energy_monthly',
  'enterprises',
  'exports',
  'files',
  'imports',
  'indicator_results',
  'load_curve_points',
  'park_members',
  'park_projects',
  'parks',
  'tasks',
  'workspace_users',
]

async function migratedDatabase() {
  const sql = await readFile(new URL('../../../drizzle/0001_project_workbench.sql', import.meta.url), 'utf8')
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(sql)
  return db
}

test('project workbench migration creates the complete P0 schema', async () => {
  const db = await migratedDatabase()
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all().map((row) => row.name)

  assert.deepEqual(tables, expectedTables)
})

test('project membership is unique and park queries use its index', async () => {
  const db = await migratedDatabase()
  db.prepare(`INSERT INTO workspace_users (id, email, org_role, invitation_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run('user-1', 'owner@example.test', 'org_admin', 'active', '2026-08-26T00:00:00Z', '2026-08-26T00:00:00Z')
  db.prepare(`INSERT INTO parks (id, name, region, park_type, baseline_year, target_year, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('park-1', '测试园区', '山西省', '工业园区', 2025, 2030, 'active', 'user-1', '2026-08-26T00:00:00Z', '2026-08-26T00:00:00Z')
  const insert = db.prepare(`INSERT INTO park_members (id, park_id, user_id, email, role, member_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  insert.run('member-1', 'park-1', 'user-1', 'owner@example.test', 'admin', 'active', '2026-08-26T00:00:00Z', '2026-08-26T00:00:00Z')

  assert.throws(
    () => insert.run('member-2', 'park-1', 'user-1', 'owner@example.test', 'viewer', 'active', '2026-08-26T00:00:00Z', '2026-08-26T00:00:00Z'),
    /UNIQUE constraint failed/,
  )

  const plan = db.prepare('EXPLAIN QUERY PLAN SELECT role FROM park_members WHERE park_id = ? AND user_id = ?')
    .all('park-1', 'user-1')
    .map((row) => row.detail)
    .join(' ')
  assert.match(plan, /idx_park_members_park_user/)
})

