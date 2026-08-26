import { WorkspaceError, cleanEmail } from './contracts.mjs'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

export function getTrustedIdentity(request, env) {
  const url = new URL(request.url)
  let userId = request.headers.get('oai-authenticated-user-id')?.trim()
  let email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()
  let development = false

  if (env.DEV_AUTH_ENABLED === 'true' && LOOPBACK_HOSTS.has(url.hostname)) {
    const developmentUserId = request.headers.get('x-dev-user-id')?.trim()
    const developmentEmail = request.headers.get('x-dev-user-email')?.trim().toLowerCase()
    if (developmentUserId && developmentEmail) {
      userId = developmentUserId
      email = developmentEmail
      development = true
    }
  }

  if (!userId || !email) throw new WorkspaceError('AUTH_REQUIRED', '请先登录项目工作台。', 401)
  return { sitesUserId: userId, email: cleanEmail(email), development }
}

async function findWorkspaceUser(db, identity) {
  const bySitesId = await db.prepare(`SELECT * FROM workspace_users WHERE sites_user_id = ? AND invitation_status = 'active'`)
    .bind(identity.sitesUserId).first()
  if (bySitesId) return bySitesId
  return db.prepare(`SELECT * FROM workspace_users WHERE email = ? AND invitation_status IN ('invited', 'active')`)
    .bind(identity.email).first()
}

export async function requireOrgUser(db, identity, env, deps, allowedRoles) {
  let user = await findWorkspaceUser(db, identity)
  const timestamp = deps.now()

  if (!user && (identity.development || (env.WORKSPACE_OWNER_USER_ID && identity.sitesUserId === env.WORKSPACE_OWNER_USER_ID))) {
    const id = deps.id()
    const ownerEmail = env.WORKSPACE_OWNER_EMAIL ? cleanEmail(env.WORKSPACE_OWNER_EMAIL) : identity.email
    if (!identity.development && ownerEmail !== identity.email) {
      throw new WorkspaceError('WORKSPACE_ACCESS_DENIED', '当前账号未获准进入项目工作台。', 403)
    }
    await db.prepare(`INSERT INTO workspace_users
      (id, sites_user_id, email, org_role, invitation_status, last_login_at, created_at, updated_at)
      VALUES (?, ?, ?, 'org_admin', 'active', ?, ?, ?)`)
      .bind(id, identity.sitesUserId, identity.email, timestamp, timestamp, timestamp).run()
    user = await findWorkspaceUser(db, identity)
  } else if (user && !user.sites_user_id) {
    await db.prepare(`UPDATE workspace_users SET sites_user_id = ?, invitation_status = 'active', last_login_at = ?, updated_at = ? WHERE id = ?`)
      .bind(identity.sitesUserId, timestamp, timestamp, user.id).run()
    await db.prepare(`UPDATE park_members SET user_id = ?, member_status = 'active', updated_at = ? WHERE email = ? AND user_id IS NULL`)
      .bind(user.id, timestamp, identity.email).run()
    user = await findWorkspaceUser(db, identity)
  } else if (user) {
    await db.prepare('UPDATE workspace_users SET last_login_at = ?, updated_at = ? WHERE id = ?')
      .bind(timestamp, timestamp, user.id).run()
  }

  if (!user) throw new WorkspaceError('WORKSPACE_ACCESS_DENIED', '当前账号未获准进入项目工作台。', 403)
  if (allowedRoles && !allowedRoles.includes(user.org_role)) {
    throw new WorkspaceError('ORG_ROLE_DENIED', '当前组织角色无权执行此操作。', 403)
  }
  return user
}

export async function requireParkRole(db, parkId, user, allowedRoles) {
  const member = await db.prepare(`SELECT * FROM park_members
    WHERE park_id = ? AND user_id = ? AND member_status = 'active'`)
    .bind(parkId, user.id).first()
  if (!member || (allowedRoles && !allowedRoles.includes(member.role))) {
    throw new WorkspaceError('PARK_ACCESS_DENIED', '当前账号无权访问或修改该园区。', 403)
  }
  return member
}
