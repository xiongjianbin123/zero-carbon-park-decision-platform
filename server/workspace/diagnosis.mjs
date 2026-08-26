import { INDICATOR_DEFINITIONS, INDICATOR_VERSION } from '../../src/config/indicatorDefinitions.ts'
import { requireOrgUser, requireParkRole } from './auth.mjs'
import { WorkspaceError } from './contracts.mjs'

const WRITE_ROLES = ['admin', 'manager', 'specialist']
const definitionByKey = Object.fromEntries(INDICATOR_DEFINITIONS.map((item) => [item.key, item]))

const round = (value) => Math.round(value * 100) / 100
const unique = (values) => [...new Set(values.filter(Boolean))]

function result(key, currentValue, status, inputImportIds, calculationNote, missingData = []) {
  const definition = definitionByKey[key]
  return {
    key,
    title: definition.title,
    currentValue,
    targetValue: definition.targetValue,
    unit: definition.unit,
    status,
    inputImportIds: unique(inputImportIds),
    calculationNote,
    missingData,
  }
}

function missing(key, note, missingData) {
  return result(key, null, 'missing_data', [], note, missingData)
}

export function calculateIndicators({ imports, energy, load, enterprises, projects }) {
  const importIds = (kind) => imports.filter((item) => item.import_type === kind).map((item) => item.id)
  const importedKinds = new Set(imports.map((item) => item.import_type))
  const results = []

  if (!imports.length) {
    results.push(missing('data_completeness', '尚未导入任何基础数据。', ['energy_monthly', 'load_curve', 'enterprises', 'projects']))
  } else {
    const current = round(importedKinds.size / 4 * 100)
    const missingData = ['energy_monthly', 'load_curve', 'enterprises', 'projects'].filter((kind) => !importedKinds.has(kind))
    results.push(result('data_completeness', current, current >= 100 ? 'achieved' : 'gap', imports.map((item) => item.id), `已具备 ${importedKinds.size}/4 类 P0 基础数据。`, missingData))
  }

  if (!energy.length) {
    results.push(missing('green_electricity_share', '缺少月度能源账单，无法计算绿电消费占比。', ['energy_monthly']))
  } else {
    const electricity = energy.reduce((sum, row) => sum + Number(row.electricity_kwh || 0), 0)
    const green = energy.reduce((sum, row) => sum + Number(row.green_electricity_kwh || 0), 0)
    if (electricity <= 0) {
      results.push(result('green_electricity_share', null, 'not_applicable', importIds('energy_monthly'), '用电量合计为 0，本期不计算占比。'))
    } else {
      const current = round(green / electricity * 100)
      results.push(result('green_electricity_share', current, current >= 90 ? 'achieved' : 'gap', importIds('energy_monthly'), `绿电量 ${round(green)} kWh ÷ 用电量 ${round(electricity)} kWh。`))
    }
  }

  if (!load.length) {
    results.push(missing('load_peak_valley_ratio', '缺少时序负荷，无法计算峰谷比。', ['load_curve']))
  } else {
    const values = load.map((row) => Number(row.load_kw)).filter(Number.isFinite)
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    if (minimum <= 0) {
      results.push(result('load_peak_valley_ratio', null, 'not_applicable', importIds('load_curve'), '最小负荷不大于 0，峰谷比无有效分母。'))
    } else {
      const current = round(maximum / minimum)
      results.push(result('load_peak_valley_ratio', current, current <= 1.5 ? 'achieved' : 'gap', importIds('load_curve'), `最大负荷 ${round(maximum)} kW ÷ 最小负荷 ${round(minimum)} kW。`))
    }
  }

  if (!projects.length) {
    results.push(missing('renewable_capacity', '缺少项目清单，无法汇总可再生能源项目容量。', ['projects']))
    results.push(missing('project_investment_readiness', '缺少项目清单，无法核查投资数据。', ['projects']))
  } else {
    const renewable = projects.filter((row) => /光伏|风电|可再生|新能源/.test(String(row.project_type || '')))
    if (!renewable.length) {
      results.push(result('renewable_capacity', null, 'not_applicable', importIds('projects'), '当前项目清单不含可再生能源项目。'))
    } else {
      const convertible = renewable.filter((row) => row.capacity_value !== null && row.capacity_value !== undefined && ['MW', 'KW'].includes(String(row.capacity_unit || '').toUpperCase()))
      if (!convertible.length) {
        results.push(result('renewable_capacity', null, 'missing_data', importIds('projects'), '可再生能源项目缺少可换算为 MW 的容量。', ['project_capacity']))
      } else {
        const current = round(convertible.reduce((sum, row) => sum + Number(row.capacity_value) / (String(row.capacity_unit).toUpperCase() === 'KW' ? 1000 : 1), 0))
        results.push(result('renewable_capacity', current, current >= 1 ? 'achieved' : 'gap', importIds('projects'), '汇总光伏、风电、可再生能源和新能源项目的 MW/kW 容量。'))
      }
    }
    const investmentCount = projects.filter((row) => row.investment_ten_thousand_yuan !== null && row.investment_ten_thousand_yuan !== undefined).length
    const readiness = round(investmentCount / projects.length * 100)
    results.push(result('project_investment_readiness', readiness, readiness >= 100 ? 'achieved' : 'gap', importIds('projects'), `${investmentCount}/${projects.length} 个项目已填写投资额。`, readiness < 100 ? ['project_investment'] : []))
  }

  if (!enterprises.length) {
    results.push(missing('enterprise_energy_coverage', '缺少企业清单，无法计算企业能耗数据覆盖率。', ['enterprises']))
  } else {
    const covered = enterprises.filter((row) => row.comprehensive_energy_tce !== null || row.annual_electricity_kwh !== null).length
    const current = round(covered / enterprises.length * 100)
    results.push(result('enterprise_energy_coverage', current, current >= 100 ? 'achieved' : 'gap', importIds('enterprises'), `${covered}/${enterprises.length} 家企业已填写综合能耗或年用电量。`, current < 100 ? ['enterprise_energy'] : []))
  }

  return INDICATOR_DEFINITIONS.map((definition) => results.find((item) => item.key === definition.key))
}

function diagnosisShape(rows, dataBaselineDate) {
  if (!rows.length) return null
  const results = rows.map((row) => ({
    id: row.id,
    key: row.indicator_key,
    title: definitionByKey[row.indicator_key]?.title ?? row.indicator_key,
    currentValue: row.current_value,
    targetValue: row.target_value,
    unit: row.unit,
    status: row.status,
    inputImportIds: JSON.parse(row.input_import_ids || '[]'),
    calculationNote: row.calculation_note,
    missingData: JSON.parse(row.missing_data || '[]'),
  }))
  return {
    runId: rows[0].diagnosis_run_id,
    version: rows[0].indicator_version,
    calculatedAt: rows[0].calculated_at,
    dataBaselineDate,
    results,
    missingData: unique(results.flatMap((item) => item.missingData)),
  }
}

async function baselineDate(db, parkId) {
  return db.prepare(`SELECT MAX(period_end) AS value FROM imports WHERE park_id = ? AND status = 'succeeded'`)
    .bind(parkId).first('value')
}

async function dataForPark(db, parkId) {
  const [imports, energy, load, enterprises, projects] = await Promise.all([
    db.prepare(`SELECT * FROM imports WHERE park_id = ? AND status = 'succeeded'`).bind(parkId).all(),
    db.prepare('SELECT * FROM energy_monthly WHERE park_id = ?').bind(parkId).all(),
    db.prepare('SELECT * FROM load_curve_points WHERE park_id = ?').bind(parkId).all(),
    db.prepare('SELECT * FROM enterprises WHERE park_id = ?').bind(parkId).all(),
    db.prepare('SELECT * FROM park_projects WHERE park_id = ?').bind(parkId).all(),
  ])
  return { imports: imports.results, energy: energy.results, load: load.results, enterprises: enterprises.results, projects: projects.results }
}

export function createDiagnosisService({ db, env, deps }) {
  return {
    async generate(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      const runId = deps.id()
      const calculatedAt = deps.now()
      const calculated = calculateIndicators(await dataForPark(db, parkId))
      const statements = calculated.map((item) => db.prepare(`INSERT INTO indicator_results
        (id, diagnosis_run_id, park_id, indicator_key, indicator_version, current_value, target_value, unit, status, input_import_ids, calculation_note, missing_data, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(deps.id(), runId, parkId, item.key, INDICATOR_VERSION, item.currentValue, item.targetValue, item.unit, item.status, JSON.stringify(item.inputImportIds), item.calculationNote, JSON.stringify(item.missingData), calculatedAt))
      await db.batch(statements)
      await db.prepare(`INSERT INTO audit_logs
        (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
        VALUES (?, ?, ?, 'diagnosis.generate', 'diagnosis', ?, 'succeeded', ?, ?)`)
        .bind(deps.id(), parkId, user.id, runId, INDICATOR_VERSION, calculatedAt).run()
      return diagnosisShape(await this.rows(runId, parkId), await baselineDate(db, parkId))
    },

    async latest(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const latest = await db.prepare(`SELECT diagnosis_run_id FROM indicator_results WHERE park_id = ? ORDER BY rowid DESC LIMIT 1`)
        .bind(parkId).first()
      if (!latest) throw new WorkspaceError('DIAGNOSIS_NOT_FOUND', '该园区尚未生成指标诊断。', 404)
      return diagnosisShape(await this.rows(latest.diagnosis_run_id, parkId), await baselineDate(db, parkId))
    },

    async rows(runId, parkId) {
      const rows = await db.prepare(`SELECT * FROM indicator_results WHERE diagnosis_run_id = ? AND park_id = ? ORDER BY rowid`)
        .bind(runId, parkId).all()
      return rows.results
    },
  }
}

