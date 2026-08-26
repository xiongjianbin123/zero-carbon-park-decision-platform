import { describe, expect, it } from 'vitest'
import { buildExportSnapshot } from '@/services/deliverableModel'

describe('workspace deliverable snapshot', () => {
  it('carries park baseline indicator version generation time and explicit gaps', () => {
    const snapshot = buildExportSnapshot({
      park: { id: 'park-1', name: '测试园区', region: '山西省', baselineYear: 2025, targetYear: 2030 },
      dataBaselineDate: '2026-07-31',
      diagnosis: {
        version: 'p0.1',
        missingData: ['load_curve'],
        results: [{ key: 'load_peak_valley_ratio', status: 'missing_data' }],
      },
      tasks: [],
      projects: [],
      files: [],
      generatedAt: '2026-08-26T08:00:00.000Z',
    })

    expect(snapshot.park.id).toBe('park-1')
    expect(snapshot.dataBaselineDate).toBe('2026-07-31')
    expect(snapshot.indicatorVersion).toBe('p0.1')
    expect(snapshot.missingData).toEqual(['load_curve'])
    expect(snapshot.generatedAt).toBe('2026-08-26T08:00:00.000Z')
  })

  it('does not synthesize a baseline or diagnosis version when no project data exists', () => {
    const snapshot = buildExportSnapshot({
      park: { id: 'park-1', name: '空园区', region: '山西省', baselineYear: 2025, targetYear: 2030 },
      dataBaselineDate: null,
      diagnosis: null,
      tasks: [], projects: [], files: [], generatedAt: '2026-08-26T08:00:00.000Z',
    })

    expect(snapshot.dataBaselineDate).toBeNull()
    expect(snapshot.indicatorVersion).toBeNull()
    expect(snapshot.missingData).toEqual(['diagnosis'])
  })
})

