import type { DiagnosisRun, IndicatorResult, WorkspaceTask } from '@/types/workspace'

export type ReadinessState = 'ready' | 'in_progress' | 'action_required' | 'not_applicable'

export interface ReadinessRow {
  indicatorId: string
  title: string
  diagnosisStatus: IndicatorResult['status']
  state: ReadinessState
  taskCount: number
  evidenceCount: number
  nextAction: string
}

const dataLabels: Record<string, string> = {
  energy_monthly: '月度能源账单', load_curve: '负荷曲线', enterprises: '企业清单', projects: '项目清单',
}

export function buildReadinessRows(diagnosis: DiagnosisRun | null, tasks: WorkspaceTask[]): ReadinessRow[] {
  if (!diagnosis) return []
  return diagnosis.results.map((indicator) => {
    const related = tasks.filter((task) => task.sourceIndicatorId === indicator.id && task.status !== 'cancelled')
    const evidenceCount = related.reduce((sum, task) => sum + task.evidenceCount, 0)
    if (indicator.status === 'not_applicable') return { indicatorId: indicator.id, title: indicator.title, diagnosisStatus: indicator.status, state: 'not_applicable', taskCount: related.length, evidenceCount, nextAction: '当前不纳入申报核对范围' }
    if (indicator.status === 'achieved') return { indicatorId: indicator.id, title: indicator.title, diagnosisStatus: indicator.status, state: 'ready', taskCount: related.length, evidenceCount, nextAction: '保持数据更新并归档支撑材料' }
    if (related.length) return { indicatorId: indicator.id, title: indicator.title, diagnosisStatus: indicator.status, state: 'in_progress', taskCount: related.length, evidenceCount, nextAction: `推进 ${related.length} 项关联任务并重新诊断` }
    const missing = indicator.missingData.map((key) => dataLabels[key] || key).join('、')
    return { indicatorId: indicator.id, title: indicator.title, diagnosisStatus: indicator.status, state: 'action_required', taskCount: 0, evidenceCount: 0, nextAction: missing ? `补充${missing}并重新诊断` : '创建差距整改任务并明确责任人' }
  })
}

export function summarizeReadiness(rows: ReadinessRow[]) {
  const applicable = rows.filter((row) => row.state !== 'not_applicable')
  const ready = applicable.filter((row) => row.state === 'ready').length
  const inProgress = applicable.filter((row) => row.state === 'in_progress').length
  const actionRequired = applicable.filter((row) => row.state === 'action_required').length
  return { applicable: applicable.length, ready, inProgress, actionRequired, readinessRate: applicable.length ? Math.round(ready / applicable.length * 100) : 0 }
}
