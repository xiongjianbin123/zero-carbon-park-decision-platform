import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateIndicators } from '../../../server/workspace/diagnosis.mjs'

test('indicator engine never fills missing inputs from demo values or averages', () => {
  const results = calculateIndicators({ imports: [], energy: [], load: [], enterprises: [], projects: [] })
  assert.ok(results.every((item) => ['missing_data', 'not_applicable'].includes(item.status)))
  assert.ok(results.every((item) => item.currentValue === null))
  assert.deepEqual(results.flatMap((item) => item.inputImportIds), [])
})

test('indicator engine calculates achieved and gap branches from normalized rows', () => {
  const results = calculateIndicators({
    imports: [
      { id: 'energy-1', import_type: 'energy_monthly' },
      { id: 'load-1', import_type: 'load_curve' },
      { id: 'enterprise-1', import_type: 'enterprises' },
      { id: 'project-1', import_type: 'projects' },
    ],
    energy: [{ import_id: 'energy-1', electricity_kwh: 1000, green_electricity_kwh: 900 }],
    load: [{ import_id: 'load-1', load_kw: 100 }, { import_id: 'load-1', load_kw: 200 }],
    enterprises: [
      { import_id: 'enterprise-1', comprehensive_energy_tce: 10, annual_electricity_kwh: 100 },
      { import_id: 'enterprise-1', comprehensive_energy_tce: null, annual_electricity_kwh: null },
    ],
    projects: [{
      import_id: 'project-1', project_type: '光伏', investment_ten_thousand_yuan: 5000,
      capacity_value: 20, capacity_unit: 'MW',
    }],
  })

  assert.deepEqual(
    Object.fromEntries(results.map((item) => [item.key, [item.currentValue, item.status]])),
    {
      data_completeness: [100, 'achieved'],
      green_electricity_share: [90, 'achieved'],
      load_peak_valley_ratio: [2, 'gap'],
      renewable_capacity: [20, 'achieved'],
      enterprise_energy_coverage: [50, 'gap'],
      project_investment_readiness: [100, 'achieved'],
    },
  )
})

test('indicator engine marks zero denominator and non-renewable scope not applicable', () => {
  const results = calculateIndicators({
    imports: [{ id: 'energy-1', import_type: 'energy_monthly' }, { id: 'project-1', import_type: 'projects' }],
    energy: [{ import_id: 'energy-1', electricity_kwh: 0, green_electricity_kwh: 0 }],
    load: [],
    enterprises: [],
    projects: [{ import_id: 'project-1', project_type: '节水', investment_ten_thousand_yuan: 100 }],
  })

  assert.equal(results.find((item) => item.key === 'green_electricity_share').status, 'not_applicable')
  assert.equal(results.find((item) => item.key === 'renewable_capacity').status, 'not_applicable')
})

