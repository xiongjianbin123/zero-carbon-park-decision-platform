import { WorkspaceError, asYear, cleanEmail, cleanText } from './contracts.mjs'
import { requireOrgUser, requireParkRole } from './auth.mjs'

const EDIT_ROLES = ['admin', 'manager']
const PARK_ROLES = ['admin', 'manager', 'specialist', 'viewer']

function parseJsonArray(value) {
  try { return JSON.parse(value || '[]') } catch { return [] }
}

function parkShape(row) {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    parkType: row.park_type,
    leadingIndustries: parseJsonArray(row.leading_industries),
    baselineYear: row.baseline_year,
    targetYear: row.target_year,
    applicationDirection: row.application_direction,
    dataBaselineDate: row.data_baseline_date,
    status: row.status,
    role: row.role,
  }
}

function validatePark(body, current = {}) {
  const baselineYear = body.baselineYear === undefined ? current.baseline_year : asYear(body.baselineYear, 'baselineYear')
  const targetYear = body.targetYear === undefined ? current.target_year : asYear(body.targetYear, 'targetYear')
  if (targetYear < baselineYear) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { targetYear: '目标年不能早于基准年。' })
  }
  const industries = body.leadingIndustries === undefined ? parseJsonArray(current.leading_industries) : body.leadingIndustries
  if (!Array.isArray(industries) || industries.length > 12 || industries.some((item) => typeof item !== 'string' || !item.trim() || item.length > 40)) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { leadingIndustries: '主导产业最多 12 项，每项不超过 40 字。' })
  }
  return {
    name: body.name === undefined ? current.name : cleanText(body.name, 'name', { max: 120 }),
    region: body.region === undefined ? current.region : cleanText(body.region, 'region', { max: 120 }),
    parkType: body.parkType === undefined ? current.park_type : cleanText(body.parkType, 'parkType', { max: 80 }),
    leadingIndustries: industries.map((item) => item.trim()),
    baselineYear,
    targetYear,
    applicationDirection: body.applicationDirection === undefined
      ? current.application_direction
      : cleanText(body.applicationDirection, 'applicationDirection', { min: 0, max: 120 }),
  }
}

async function audit(db, deps, { parkId, userId, action, objectType, objectId, summary = '' }) {
  await db.prepare(`INSERT INTO audit_logs (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'succeeded', ?, ?)`)
    .bind(deps.id(), parkId, userId, action, objectType, objectId, summary.slice(0, 300), deps.now()).run()
}

export function createParkService({ db, env, deps }) {
  return {
    async me(identity) {
      const user = await requireOrgUser(db, identity, env, deps)
      return { id: user.id, email: user.email, orgRole: user.org_role }
    },

    async list(identity) {
      const user = await requireOrgUser(db, identity, env, deps)
      const result = await db.prepare(`SELECT p.*, pm.role FROM parks p
        JOIN park_members pm ON pm.park_id = p.id
        WHERE pm.user_id = ? AND pm.member_status = 'active'
        ORDER BY p.created_at, p.name`)
        .bind(user.id).all()
      return result.results.map(parkShape)
    },

    async create(identity, body) {
      const user = await requireOrgUser(db, identity, env, deps, ['org_admin'])
      const input = validatePark(body)
      const parkId = deps.id()
      const memberId = deps.id()
      const auditId = deps.id()
      const timestamp = deps.now()
      await db.batch([
        db.prepare(`INSERT INTO parks
          (id, name, region, park_type, leading_industries, baseline_year, target_year, application_direction, status, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
          .bind(parkId, input.name, input.region, input.parkType, JSON.stringify(input.leadingIndustries), input.baselineYear, input.targetYear, input.applicationDirection, user.id, timestamp, timestamp),
        db.prepare(`INSERT INTO park_members
          (id, park_id, user_id, email, role, member_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?)`)
          .bind(memberId, parkId, user.id, user.email, timestamp, timestamp),
        db.prepare(`INSERT INTO audit_logs
          (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
          VALUES (?, ?, ?, 'park.create', 'park', ?, 'succeeded', ?, ?)`)
          .bind(auditId, parkId, user.id, parkId, input.name, timestamp),
      ])
      return this.get(identity, parkId)
    },

    async get(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      const member = await requireParkRole(db, parkId, user)
      const park = await db.prepare('SELECT * FROM parks WHERE id = ?').bind(parkId).first()
      if (!park) throw new WorkspaceError('PARK_NOT_FOUND', '未找到该园区。', 404)
      return parkShape({ ...park, role: member.role })
    },

    async update(identity, parkId, body) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, EDIT_ROLES)
      const current = await db.prepare('SELECT * FROM parks WHERE id = ?').bind(parkId).first()
      if (!current) throw new WorkspaceError('PARK_NOT_FOUND', '未找到该园区。', 404)
      const input = validatePark(body, current)
      await db.prepare(`UPDATE parks SET name = ?, region = ?, park_type = ?, leading_industries = ?, baseline_year = ?, target_year = ?, application_direction = ?, updated_at = ? WHERE id = ?`)
        .bind(input.name, input.region, input.parkType, JSON.stringify(input.leadingIndustries), input.baselineYear, input.targetYear, input.applicationDirection, deps.now(), parkId).run()
      await audit(db, deps, { parkId, userId: user.id, action: 'park.update', objectType: 'park', objectId: parkId })
      return this.get(identity, parkId)
    },

    async listMembers(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const result = await db.prepare(`SELECT id, email, role, member_status FROM park_members WHERE park_id = ? ORDER BY created_at, email`)
        .bind(parkId).all()
      return result.results.map((row) => ({ id: row.id, email: row.email, role: row.role, status: row.member_status }))
    },

    async inviteMember(identity, parkId, body) {
      const actor = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, actor, ['admin'])
      const email = cleanEmail(body.email)
      if (!PARK_ROLES.includes(body.role)) throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { role: '请选择有效项目角色。' })
      let user = await db.prepare('SELECT * FROM workspace_users WHERE email = ?').bind(email).first()
      const timestamp = deps.now()
      if (!user) {
        const userId = deps.id()
        await db.prepare(`INSERT INTO workspace_users
          (id, email, org_role, invitation_status, invited_by, created_at, updated_at)
          VALUES (?, ?, 'org_member', 'invited', ?, ?, ?)`)
          .bind(userId, email, actor.id, timestamp, timestamp).run()
        user = await db.prepare('SELECT * FROM workspace_users WHERE id = ?').bind(userId).first()
      }
      const memberId = deps.id()
      await db.prepare(`INSERT INTO park_members
        (id, park_id, user_id, email, role, member_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(memberId, parkId, user.sites_user_id ? user.id : null, email, body.role, user.sites_user_id ? 'active' : 'invited', timestamp, timestamp).run()
      await audit(db, deps, { parkId, userId: actor.id, action: 'member.invite', objectType: 'park_member', objectId: memberId })
      return { id: memberId, email, role: body.role, status: user.sites_user_id ? 'active' : 'invited' }
    },

    async updateMember(identity, parkId, memberId, body) {
      const actor = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, actor, ['admin'])
      if (!PARK_ROLES.includes(body.role)) throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { role: '请选择有效项目角色。' })
      const result = await db.prepare('UPDATE park_members SET role = ?, updated_at = ? WHERE id = ? AND park_id = ?')
        .bind(body.role, deps.now(), memberId, parkId).run()
      if (!result.meta.changes) throw new WorkspaceError('MEMBER_NOT_FOUND', '未找到该成员。', 404)
      await audit(db, deps, { parkId, userId: actor.id, action: 'member.update', objectType: 'park_member', objectId: memberId })
      return this.listMembers(identity, parkId).then((members) => members.find((member) => member.id === memberId))
    },
  }
}

