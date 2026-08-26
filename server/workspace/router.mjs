import { ensureSchema } from './db.mjs'
import { getTrustedIdentity } from './auth.mjs'
import { readWorkspaceJson, workspaceErrorResponse, workspaceJson, WorkspaceError } from './contracts.mjs'
import { createParkService } from './parks.mjs'

const defaultDeps = {
  id: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

export function createWorkspaceRouter(deps = {}) {
  const runtimeDeps = { ...defaultDeps, ...deps }

  return {
    async handle(request, env = {}) {
      const url = new URL(request.url)
      const workspacePath = url.pathname === '/api/auth/me' || url.pathname.startsWith('/api/workspace/')
      if (!workspacePath) return null

      try {
        if (!env.DB || !env.FILES) throw new WorkspaceError('WORKSPACE_UNAVAILABLE', '项目工作台存储服务暂时不可用。', 503)
        await ensureSchema(env.DB)
        const identity = getTrustedIdentity(request, env)
        const service = createParkService({ db: env.DB, env, deps: runtimeDeps })

        if (request.method === 'GET' && url.pathname === '/api/auth/me') {
          return workspaceJson({ user: await service.me(identity) })
        }
        if (url.pathname === '/api/workspace/parks') {
          if (request.method === 'GET') return workspaceJson({ parks: await service.list(identity) })
          if (request.method === 'POST') return workspaceJson({ park: await service.create(identity, await readWorkspaceJson(request)) }, 201)
        }

        const memberMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/members(?:\/([^/]+))?$/)
        if (memberMatch) {
          const parkId = decodeURIComponent(memberMatch[1])
          const memberId = memberMatch[2] ? decodeURIComponent(memberMatch[2]) : null
          if (request.method === 'GET' && !memberId) return workspaceJson({ members: await service.listMembers(identity, parkId) })
          if (request.method === 'POST' && !memberId) return workspaceJson({ member: await service.inviteMember(identity, parkId, await readWorkspaceJson(request)) }, 201)
          if (request.method === 'PATCH' && memberId) return workspaceJson({ member: await service.updateMember(identity, parkId, memberId, await readWorkspaceJson(request)) })
        }

        const parkMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)$/)
        if (parkMatch) {
          const parkId = decodeURIComponent(parkMatch[1])
          if (request.method === 'GET') return workspaceJson({ park: await service.get(identity, parkId) })
          if (request.method === 'PATCH') return workspaceJson({ park: await service.update(identity, parkId, await readWorkspaceJson(request)) })
        }

        return workspaceJson({ code: 'NOT_FOUND', message: '接口不存在。' }, 404)
      } catch (error) {
        return workspaceErrorResponse(error)
      }
    },
  }
}

