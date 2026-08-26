import { describe, expect, it } from 'vitest'
import { IMPORT_COLUMNS, parseRows } from '@/services/importWorkbook'

describe('workspace import contracts', () => {
  it('normalizes a valid monthly energy row with documented units', () => {
    const preview = parseRows('energy_monthly', [{
      月份: '2026-01',
      用电量kWh: 120000,
      电费元: 78000,
      绿电电量kWh: 60000,
    }])

    expect(preview.rowErrors).toEqual([])
    expect(preview.normalizedRows).toEqual([{
      sourceRow: 2,
      reportMonth: '2026-01',
      electricityKwh: 120000,
      electricityCostYuan: 78000,
      greenElectricityKwh: 60000,
      naturalGasM3: null,
      heatGj: null,
      steamT: null,
    }])
  })

  it('reports a missing required column instead of accepting the wrong unit', () => {
    const preview = parseRows('energy_monthly', [{ 月份: '2026-01', 用电量MWh: 120, 电费元: 78000 }])

    expect(preview.rowErrors).toContainEqual({
      row: 1,
      field: '用电量kWh',
      code: 'MISSING_COLUMN',
      message: '缺少必填列：用电量kWh',
    })
  })

  it('rejects negative energy and cost values at their source row', () => {
    const preview = parseRows('energy_monthly', [{ 月份: '2026-01', 用电量kWh: -1, 电费元: -2 }])

    expect(preview.rowErrors.filter((item) => item.code === 'NEGATIVE_VALUE')).toHaveLength(2)
    expect(preview.rowErrors.every((item) => item.row === 2)).toBe(true)
  })

  it('rejects duplicate timestamps and unsupported load intervals', () => {
    const preview = parseRows('load_curve', [
      { 时间: '2026-01-01 00:00', 负荷kW: 100 },
      { 时间: '2026-01-01 00:20', 负荷kW: 120 },
      { 时间: '2026-01-01 00:20', 负荷kW: 130 },
    ])

    expect(preview.rowErrors.map((item) => item.code)).toEqual(expect.arrayContaining([
      'UNSUPPORTED_INTERVAL',
      'DUPLICATE_TIMESTAMP',
    ]))
  })

  it('accepts only a consistent 15, 30, or 60 minute load interval', () => {
    const preview = parseRows('load_curve', [
      { 时间: '2026-01-01 00:00', 负荷kW: 100, 光伏kW: 0 },
      { 时间: '2026-01-01 00:15', 负荷kW: 120, 光伏kW: 10 },
      { 时间: '2026-01-01 00:30', 负荷kW: 110, 光伏kW: 20 },
    ])

    expect(preview.rowErrors).toEqual([])
    expect(preview.intervalMinutes).toBe(15)
    expect(preview.periodStart).toBe('2026-01-01T00:00:00.000Z')
    expect(preview.periodEnd).toBe('2026-01-01T00:30:00.000Z')
  })

  it('rejects a load batch above 35,040 points before upload', () => {
    const rows = Array.from({ length: 35_041 }, (_, index) => ({
      时间: new Date(Date.UTC(2026, 0, 1, 0, index * 15)).toISOString(),
      负荷kW: 100,
    }))
    const preview = parseRows('load_curve', rows)

    expect(preview.rowErrors).toContainEqual({
      row: 1,
      field: '时间',
      code: 'BATCH_TOO_LARGE',
      message: '时序负荷单批次最多 35,040 个数据点。',
    })
  })

  it('normalizes enterprise and project contracts without inventing optional values', () => {
    const enterprises = parseRows('enterprises', [{ 企业名称: '材料一厂', 行业: '新材料', 重点用能单位: '是' }])
    const projects = parseRows('projects', [{ 项目名称: '屋顶光伏', 类型: '光伏', 状态: '储备' }])

    expect(enterprises.rowErrors).toEqual([])
    expect(enterprises.normalizedRows[0]).toMatchObject({ name: '材料一厂', industry: '新材料', keyEnergyConsumer: true })
    expect(projects.rowErrors).toEqual([])
    expect(projects.normalizedRows[0]).toMatchObject({ name: '屋顶光伏', projectType: '光伏', status: '储备', investmentTenThousandYuan: null })
  })

  it('defines the exact four downloadable template contracts', () => {
    expect(Object.keys(IMPORT_COLUMNS)).toEqual(['energy_monthly', 'load_curve', 'enterprises', 'projects'])
    expect(IMPORT_COLUMNS.energy_monthly.filter((column) => column.required).map((column) => column.header))
      .toEqual(['月份', '用电量kWh', '电费元'])
    expect(IMPORT_COLUMNS.load_curve.filter((column) => column.required).map((column) => column.header))
      .toEqual(['时间', '负荷kW'])
  })
})

