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

