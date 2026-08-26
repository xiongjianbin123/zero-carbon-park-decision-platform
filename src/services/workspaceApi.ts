import type { ParkProject } from '@/types/workspace'

export interface WorkspaceUser {
  id: string
  email: string
  orgRole: 'org_admin' | 'org_member'
}

export class WorkspaceApiError extends Error {
  status: number
  code: string
  fieldErrors?: Record<string, unknown>

  constructor(status: number, body: { code?: string; message?: string; fieldErrors?: Record<string, unknown> }) {
    super(body.message || '项目工作台暂时不可用。')
    this.name = 'WorkspaceApiError'
    this.status = status
    this.code = body.code || 'WORKSPACE_ERROR'
    this.fieldErrors = body.fieldErrors
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { 'content-type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new WorkspaceApiError(response.status, body)
  return body as T
}

export const workspaceApi = {
  async me() {
    return (await request<{ user: WorkspaceUser }>('/api/auth/me')).user
  },
  async listParks() {
    return (await request<{ parks: ParkProject[] }>('/api/workspace/parks')).parks
  },
  async createPark(input: Omit<ParkProject, 'id' | 'role' | 'status' | 'dataBaselineDate'>) {
    return (await request<{ park: ParkProject }>('/api/workspace/parks', {
      method: 'POST', body: JSON.stringify(input),
    })).park
  },
}

export type WorkspaceApi = typeof workspaceApi

