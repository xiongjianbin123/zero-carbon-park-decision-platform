interface SnapshotInput {
  park: Record<string, unknown>
  dataBaselineDate: string | null
  diagnosis: null | {
    version: string
    missingData: string[]
    results: Record<string, unknown>[]
  }
  tasks: Record<string, unknown>[]
  projects: Record<string, unknown>[]
  files: Record<string, unknown>[]
  generatedAt: string
}

export function buildExportSnapshot(input: SnapshotInput) {
  return {
    park: { ...input.park },
    dataBaselineDate: input.dataBaselineDate,
    indicatorVersion: input.diagnosis?.version ?? null,
    missingData: input.diagnosis?.missingData ?? ['diagnosis'],
    generatedAt: input.generatedAt,
    diagnosisResults: input.diagnosis?.results ?? [],
    tasks: input.tasks,
    projects: input.projects,
    files: input.files,
  }
}

