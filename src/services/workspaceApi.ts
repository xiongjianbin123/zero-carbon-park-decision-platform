import type { DiagnosisRun, ExportPreview, ExportType, ImportBatch, ImportKind, ParkProject, WorkspaceExport, WorkspaceTask } from '@/types/workspace'

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
  async listImports(parkId: string) {
    return (await request<{ imports: ImportBatch[] }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/imports`)).imports
  },
  async uploadImport(parkId: string, kind: ImportKind, file: File, replaceImportId?: string) {
    const form = new FormData()
    form.set('kind', kind)
    form.set('file', file)
    form.set('metadata', JSON.stringify(replaceImportId ? { replaceImportId } : {}))
    return (await request<{ importBatch: ImportBatch }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/imports`, { method: 'POST', body: form })).importBatch
  },
  async latestDiagnosis(parkId: string) {
    return (await request<{ diagnosis: DiagnosisRun }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/diagnosis/latest`)).diagnosis
  },
  async generateDiagnosis(parkId: string) {
    return (await request<{ diagnosis: DiagnosisRun }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/diagnosis`, { method: 'POST', body: '{}' })).diagnosis
  },
  async listTasks(parkId: string) {
    return (await request<{ tasks: WorkspaceTask[] }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/tasks`)).tasks
  },
  async createTask(parkId: string, input: Omit<WorkspaceTask, 'id' | 'parkId' | 'evidenceCount' | 'createdAt' | 'updatedAt'>) {
    return (await request<{ task: WorkspaceTask }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/tasks`, { method: 'POST', body: JSON.stringify(input) })).task
  },
  async updateTask(parkId: string, taskId: string, input: Partial<WorkspaceTask>) {
    return (await request<{ task: WorkspaceTask }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify(input) })).task
  },
  async uploadEvidence(parkId: string, taskId: string, file: File) {
    const form = new FormData()
    form.set('ownerType', 'task')
    form.set('ownerId', taskId)
    form.set('file', file)
    return (await request<{ file: { id: string; filename: string } }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/files`, { method: 'POST', body: form })).file
  },
  async previewExport(parkId: string, type: ExportType) {
    return (await request<{ preview: ExportPreview }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/exports`, { method: 'POST', body: JSON.stringify({ type, confirmed: false }) })).preview
  },
  async confirmExport(parkId: string, type: ExportType) {
    return await request<{ preview: ExportPreview; export: WorkspaceExport }>(`/api/workspace/parks/${encodeURIComponent(parkId)}/exports`, { method: 'POST', body: JSON.stringify({ type, confirmed: true }) })
  },
  exportDownloadUrl(parkId: string, exportId: string) {
    return `/api/workspace/parks/${encodeURIComponent(parkId)}/exports/${encodeURIComponent(exportId)}?download=1`
  },
  async downloadExport(parkId: string, exportId: string) {
    const response = await fetch(this.exportDownloadUrl(parkId, exportId))
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new WorkspaceApiError(response.status, body)
    }
    const disposition = response.headers.get('content-disposition') || ''
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    return { blob: await response.blob(), filename: encoded ? decodeURIComponent(encoded) : '园区项目成果.xlsx' }
  },
}

export type WorkspaceApi = typeof workspaceApi
