import { ensureSchema } from './db.mjs'
import { getTrustedIdentity } from './auth.mjs'
import { readWorkspaceJson, workspaceErrorResponse, workspaceJson, WorkspaceError } from './contracts.mjs'
import { createParkService } from './parks.mjs'
import { createImportService } from './imports.mjs'
import { createDiagnosisService } from './diagnosis.mjs'
import { createTaskFileService } from './tasks.mjs'
import { createExportService } from './exports.mjs'

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
        const imports = createImportService({ db: env.DB, files: env.FILES, env, deps: runtimeDeps })
        const diagnosis = createDiagnosisService({ db: env.DB, env, deps: runtimeDeps })
        const taskFiles = createTaskFileService({ db: env.DB, files: env.FILES, env, deps: runtimeDeps })
        const exports = createExportService({ db: env.DB, files: env.FILES, env, deps: runtimeDeps })

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

        const importMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/imports$/)
        if (importMatch) {
          const parkId = decodeURIComponent(importMatch[1])
          if (request.method === 'GET') return workspaceJson({ imports: await imports.list(identity, parkId) })
          if (request.method === 'POST') return workspaceJson({ importBatch: await imports.commit(identity, parkId, request) }, 201)
        }

        const diagnosisMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/diagnosis(?:\/(latest))?$/)
        if (diagnosisMatch) {
          const parkId = decodeURIComponent(diagnosisMatch[1])
          if (request.method === 'POST' && !diagnosisMatch[2]) return workspaceJson({ diagnosis: await diagnosis.generate(identity, parkId) }, 201)
          if (request.method === 'GET' && diagnosisMatch[2] === 'latest') return workspaceJson({ diagnosis: await diagnosis.latest(identity, parkId) })
        }

        const taskMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/tasks(?:\/([^/]+))?$/)
        if (taskMatch) {
          const parkId = decodeURIComponent(taskMatch[1])
          const taskId = taskMatch[2] ? decodeURIComponent(taskMatch[2]) : null
          if (request.method === 'GET' && !taskId) return workspaceJson({ tasks: await taskFiles.listTasks(identity, parkId) })
          if (request.method === 'POST' && !taskId) return workspaceJson({ task: await taskFiles.createTask(identity, parkId, await readWorkspaceJson(request)) }, 201)
          if (request.method === 'PATCH' && taskId) return workspaceJson({ task: await taskFiles.updateTask(identity, parkId, taskId, await readWorkspaceJson(request)) })
        }

        const taskActivityMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/tasks\/([^/]+)\/activity$/)
        if (taskActivityMatch && request.method === 'GET') {
          const parkId = decodeURIComponent(taskActivityMatch[1])
          const taskId = decodeURIComponent(taskActivityMatch[2])
          return workspaceJson({ activity: await taskFiles.listTaskActivity(identity, parkId, taskId) })
        }

        const fileMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/files(?:\/([^/]+))?$/)
        if (fileMatch) {
          const parkId = decodeURIComponent(fileMatch[1])
          const fileId = fileMatch[2] ? decodeURIComponent(fileMatch[2]) : null
          if (request.method === 'GET' && !fileId) return workspaceJson({ files: await taskFiles.listFiles(identity, parkId, {
            ownerType: url.searchParams.get('ownerType'), ownerId: url.searchParams.get('ownerId'),
          }) })
          if (request.method === 'POST' && !fileId) return workspaceJson({ file: await taskFiles.uploadFile(identity, parkId, request) }, 201)
          if (request.method === 'GET' && fileId) return taskFiles.downloadFile(identity, parkId, fileId)
        }

        const exportMatch = url.pathname.match(/^\/api\/workspace\/parks\/([^/]+)\/exports(?:\/([^/]+))?$/)
        if (exportMatch) {
          const parkId = decodeURIComponent(exportMatch[1])
          const exportId = exportMatch[2] ? decodeURIComponent(exportMatch[2]) : null
          if (request.method === 'GET' && !exportId) return workspaceJson({ exports: await exports.list(identity, parkId) })
          if (request.method === 'POST' && !exportId) {
            const generated = await exports.generate(identity, parkId, await readWorkspaceJson(request))
            return generated.exported
              ? workspaceJson({ preview: generated.preview, export: generated.exported }, 201)
              : workspaceJson({ preview: generated.preview })
          }
          if (request.method === 'GET' && exportId) {
            const found = await exports.get(identity, parkId, exportId, url.searchParams.get('download') === '1')
            return found.response ?? workspaceJson({ export: found.exported })
          }
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
