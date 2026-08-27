export type ImportKind = 'energy_monthly' | 'load_curve' | 'enterprises' | 'projects'

export interface ImportColumn {
  key: string
  header: string
  required: boolean
  description: string
  example: string | number
}

export interface ImportRowError {
  row: number
  field: string
  code: string
  message: string
}

export interface ImportPreview {
  kind: ImportKind
  headers: string[]
  normalizedRows: Record<string, unknown>[]
  rowErrors: ImportRowError[]
  periodStart: string | null
  periodEnd: string | null
  intervalMinutes: number | null
  digest: string | null
  filename: string | null
}

export interface ParkProject {
  id: string
  name: string
  region: string
  parkType: string
  leadingIndustries: string[]
  baselineYear: number
  targetYear: number
  applicationDirection: string
  dataBaselineDate: string | null
  status: 'active' | 'archived'
  role: 'admin' | 'manager' | 'specialist' | 'viewer'
}

export type ParkRole = 'admin' | 'manager' | 'specialist' | 'viewer'

export interface WorkspaceMember {
  id: string
  email: string
  role: ParkRole
  status: 'active' | 'invited' | 'suspended'
}

export interface ImportBatch {
  id: string
  kind: ImportKind
  filename: string
  periodStart: string | null
  periodEnd: string | null
  intervalMinutes: number | null
  acceptedRows: number
  rejectedRows: number
  status: 'pending' | 'succeeded' | 'failed' | 'replaced'
  createdAt: string
  completedAt: string | null
}

export type DiagnosisStatus = 'achieved' | 'gap' | 'missing_data' | 'not_applicable'

export interface IndicatorResult {
  id: string
  key: string
  title: string
  currentValue: number | null
  targetValue: number | null
  unit: string
  status: DiagnosisStatus
  calculationNote: string
  missingData: string[]
}

export interface DiagnosisRun {
  runId?: string
  version: string
  calculatedAt: string
  dataBaselineDate: string | null
  results: IndicatorResult[]
  missingData: string[]
}

export type TaskStatus = 'draft' | 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'

export interface WorkspaceTask {
  id: string
  parkId?: string
  sourceIndicatorId?: string | null
  taskType: string
  title: string
  ownerName: string
  plannedDate: string
  status: TaskStatus
  reviewNote: string
  evidenceCount: number
  createdAt?: string
  updatedAt?: string
}

export interface TaskEvidenceFile {
  id: string
  ownerType: 'task'
  ownerId: string
  filename: string
  contentType: string
  size: number
  checksum: string
  validationSummary: string
  uploadedAt: string
}

export interface TaskActivity {
  id: string
  action: string
  result: 'succeeded' | 'failed'
  summary: string
  createdAt: string
}

export type ExportType = 'diagnosis_report' | 'task_register' | 'project_investment' | 'evidence_catalog'

export interface ExportPreview {
  type: ExportType
  snapshot: Record<string, any>
  recordCount: number
}

export interface WorkspaceExport {
  id: string
  type: ExportType
  summary: string
  downloadAvailable: boolean
  generatedAt: string
}
