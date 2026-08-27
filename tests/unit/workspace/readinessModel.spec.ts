import { describe, expect, it } from 'vitest'
import { buildReadinessRows, summarizeReadiness } from '@/services/readinessModel'
import type { DiagnosisRun, WorkspaceTask } from '@/types/workspace'

const diagnosis: DiagnosisRun = {
  version: 'p0.1', calculatedAt: '2026-08-27T08:00:00Z', dataBaselineDate: '2026-07-31', missingData: ['load_curve'],
  results: [
    { id: 'i1', key: 'green_share', title: '清洁能源消费占比', currentValue: 95, targetValue: 90, unit: '%', status: 'achieved', calculationNote: '已达标', missingData: [] },
    { id: 'i2', key: 'carbon', title: '单位产值碳排放', currentValue: 0.8, targetValue: 0.6, unit: 'tCO₂e/万元', status: 'gap', calculationNote: '存在差距', missingData: [] },
    { id: 'i3', key: 'flexibility', title: '负荷调节能力', currentValue: null, targetValue: 5, unit: '%', status: 'missing_data', calculationNote: '缺少负荷曲线', missingData: ['load_curve'] },
    { id: 'i4', key: 'charging', title: '充电设施覆盖', currentValue: null, targetValue: 1, unit: '项', status: 'not_applicable', calculationNote: '当前不适用', missingData: [] },
  ],
}

const tasks: WorkspaceTask[] = [
  { id: 't1', sourceIndicatorId: 'i2', taskType: '项目推进', title: '实施节能改造', ownerName: '项目经理', plannedDate: '2026-09-30', status: 'in_progress', reviewNote: '', evidenceCount: 2 },
]

describe('readinessModel', () => {
  it('derives one deterministic readiness state per diagnosis indicator', () => {
    const rows = buildReadinessRows(diagnosis, tasks)

    expect(rows.map((row) => [row.indicatorId, row.state, row.taskCount, row.evidenceCount])).toEqual([
      ['i1', 'ready', 0, 0],
      ['i2', 'in_progress', 1, 2],
      ['i3', 'action_required', 0, 0],
      ['i4', 'not_applicable', 0, 0],
    ])
    expect(rows[2].nextAction).toBe('补充负荷曲线并重新诊断')
  })

  it('summarizes rows without counting not-applicable indicators in the denominator', () => {
    expect(summarizeReadiness(buildReadinessRows(diagnosis, tasks))).toEqual({
      applicable: 3, ready: 1, inProgress: 1, actionRequired: 1, readinessRate: 33,
    })
  })
})
