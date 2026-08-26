import * as XLSX from 'xlsx'
import type { ImportColumn, ImportKind, ImportPreview, ImportRowError } from '@/types/workspace'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_LOAD_POINTS = 35_040
const ALLOWED_INTERVALS = new Set([15, 30, 60])

export const IMPORT_COLUMNS: Record<ImportKind, ImportColumn[]> = {
  energy_monthly: [
    { key: 'reportMonth', header: '月份', required: true, description: 'YYYY-MM', example: '2026-01' },
    { key: 'electricityKwh', header: '用电量kWh', required: true, description: '非负数', example: 120000 },
    { key: 'electricityCostYuan', header: '电费元', required: true, description: '非负数', example: 78000 },
    { key: 'greenElectricityKwh', header: '绿电电量kWh', required: false, description: '非负数', example: 60000 },
    { key: 'naturalGasM3', header: '天然气m³', required: false, description: '非负数', example: 0 },
    { key: 'heatGj', header: '热力GJ', required: false, description: '非负数', example: 0 },
    { key: 'steamT', header: '蒸汽t', required: false, description: '非负数', example: 0 },
  ],
  load_curve: [
    { key: 'recordedAt', header: '时间', required: true, description: '15/30/60 分钟等间隔', example: '2026-01-01 00:00' },
    { key: 'loadKw', header: '负荷kW', required: true, description: '非负数', example: 1000 },
    { key: 'solarKw', header: '光伏kW', required: false, description: '非负数', example: 0 },
    { key: 'storageChargeKw', header: '储能充电kW', required: false, description: '非负数', example: 0 },
    { key: 'storageDischargeKw', header: '储能放电kW', required: false, description: '非负数', example: 0 },
  ],
  enterprises: [
    { key: 'name', header: '企业名称', required: true, description: '企业全称', example: '材料一厂' },
    { key: 'industry', header: '行业', required: true, description: '所属行业', example: '新材料' },
    { key: 'annualOutputTenThousandYuan', header: '年产值万元', required: false, description: '非负数', example: 50000 },
    { key: 'comprehensiveEnergyTce', header: '综合能耗tce', required: false, description: '非负数', example: 12000 },
    { key: 'annualElectricityKwh', header: '年用电量kWh', required: false, description: '非负数', example: 8000000 },
    { key: 'keyEnergyConsumer', header: '重点用能单位', required: false, description: '是/否', example: '是' },
  ],
  projects: [
    { key: 'name', header: '项目名称', required: true, description: '建设项目名称', example: '屋顶光伏' },
    { key: 'projectType', header: '类型', required: true, description: '项目类型', example: '光伏' },
    { key: 'status', header: '状态', required: true, description: '储备/建设/投运等', example: '储备' },
    { key: 'investmentTenThousandYuan', header: '投资万元', required: false, description: '非负数', example: 5000 },
    { key: 'capacityValue', header: '容量数值', required: false, description: '非负数', example: 20 },
    { key: 'capacityUnit', header: '容量单位', required: false, description: 'MW/MWh 等', example: 'MW' },
    { key: 'plannedStartDate', header: '计划开工', required: false, description: 'YYYY-MM-DD', example: '2026-06-01' },
    { key: 'plannedOperationDate', header: '计划投产', required: false, description: 'YYYY-MM-DD', example: '2026-12-31' },
    { key: 'expectedReductionTco2e', header: '预期减排tCO₂e', required: false, description: '非负数', example: 15000 },
  ],
}

function error(row: number, field: string, code: string, message: string): ImportRowError {
  return { row, field, code, message }
}

function textValue(value: unknown, row: number, field: string, required: boolean, errors: ImportRowError[]) {
  const text = value === null || value === undefined ? '' : String(value).trim()
  if (required && !text) errors.push(error(row, field, 'REQUIRED_VALUE', `${field}不能为空。`))
  return text || null
}

function numberValue(value: unknown, row: number, field: string, required: boolean, errors: ImportRowError[]) {
  if (value === '' || value === null || value === undefined) {
    if (required) errors.push(error(row, field, 'REQUIRED_VALUE', `${field}不能为空。`))
    return null
  }
  const number = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(number)) {
    errors.push(error(row, field, 'INVALID_NUMBER', `${field}必须是数值。`))
    return null
  }
  if (number < 0) errors.push(error(row, field, 'NEGATIVE_VALUE', `${field}不能为负数。`))
  return number
}

function monthValue(value: unknown, row: number, errors: ImportRowError[]) {
  const text = textValue(value, row, '月份', true, errors)
  if (!text) return null
  const match = text.match(/^(\d{4})[-/.年](\d{1,2})(?:月)?$/)
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
    errors.push(error(row, '月份', 'INVALID_MONTH', '月份须使用 YYYY-MM 格式。'))
    return null
  }
  return `${match[1]}-${match[2].padStart(2, '0')}`
}

function isoDate(value: unknown, row: number, field: string, errors: ImportRowError[], dateOnly = false) {
  if (value === '' || value === null || value === undefined) return null
  if (dateOnly && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim()
  const input = value instanceof Date
    ? value
    : typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(value.trim())
      ? `${value.trim().replace(' ', 'T')}Z`
      : value
  const date = new Date(input as string | number | Date)
  if (Number.isNaN(date.getTime())) {
    errors.push(error(row, field, 'INVALID_DATE', `${field}不是有效日期。`))
    return null
  }
  return dateOnly ? date.toISOString().slice(0, 10) : date.toISOString()
}

function missingColumns(kind: ImportKind, headers: string[]) {
  return IMPORT_COLUMNS[kind]
    .filter((column) => column.required && !headers.includes(column.header))
    .map((column) => error(1, column.header, 'MISSING_COLUMN', `缺少必填列：${column.header}`))
}

function energyRow(source: Record<string, unknown>, row: number, errors: ImportRowError[]) {
  return {
    sourceRow: row,
    reportMonth: monthValue(source.月份, row, errors),
    electricityKwh: numberValue(source['用电量kWh'], row, '用电量kWh', true, errors),
    electricityCostYuan: numberValue(source.电费元, row, '电费元', true, errors),
    greenElectricityKwh: numberValue(source['绿电电量kWh'], row, '绿电电量kWh', false, errors),
    naturalGasM3: numberValue(source['天然气m³'], row, '天然气m³', false, errors),
    heatGj: numberValue(source.热力GJ, row, '热力GJ', false, errors),
    steamT: numberValue(source.蒸汽t, row, '蒸汽t', false, errors),
  }
}

function loadRow(source: Record<string, unknown>, row: number, errors: ImportRowError[]) {
  return {
    sourceRow: row,
    recordedAt: isoDate(source.时间, row, '时间', errors),
    loadKw: numberValue(source['负荷kW'], row, '负荷kW', true, errors),
    solarKw: numberValue(source['光伏kW'], row, '光伏kW', false, errors),
    storageChargeKw: numberValue(source['储能充电kW'], row, '储能充电kW', false, errors),
    storageDischargeKw: numberValue(source['储能放电kW'], row, '储能放电kW', false, errors),
  }
}

function enterpriseRow(source: Record<string, unknown>, row: number, errors: ImportRowError[]) {
  const keyValue = source.重点用能单位
  const normalizedKey = keyValue === true || keyValue === 1 || ['是', 'yes', 'true', '1'].includes(String(keyValue ?? '').trim().toLowerCase())
  return {
    sourceRow: row,
    name: textValue(source.企业名称, row, '企业名称', true, errors),
    industry: textValue(source.行业, row, '行业', true, errors),
    annualOutputTenThousandYuan: numberValue(source.年产值万元, row, '年产值万元', false, errors),
    comprehensiveEnergyTce: numberValue(source['综合能耗tce'], row, '综合能耗tce', false, errors),
    annualElectricityKwh: numberValue(source['年用电量kWh'], row, '年用电量kWh', false, errors),
    keyEnergyConsumer: normalizedKey,
  }
}

function projectRow(source: Record<string, unknown>, row: number, errors: ImportRowError[]) {
  return {
    sourceRow: row,
    name: textValue(source.项目名称, row, '项目名称', true, errors),
    projectType: textValue(source.类型, row, '类型', true, errors),
    status: textValue(source.状态, row, '状态', true, errors),
    investmentTenThousandYuan: numberValue(source.投资万元, row, '投资万元', false, errors),
    capacityValue: numberValue(source.容量数值, row, '容量数值', false, errors),
    capacityUnit: textValue(source.容量单位, row, '容量单位', false, errors),
    plannedStartDate: isoDate(source.计划开工, row, '计划开工', errors, true),
    plannedOperationDate: isoDate(source.计划投产, row, '计划投产', errors, true),
    expectedReductionTco2e: numberValue(source['预期减排tCO₂e'], row, '预期减排tCO₂e', false, errors),
  }
}

export function parseRows(kind: ImportKind, rows: Record<string, unknown>[], providedHeaders?: string[]): ImportPreview {
  const headers = providedHeaders ?? [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const rowErrors = missingColumns(kind, headers)
  const preview: ImportPreview = {
    kind,
    headers,
    normalizedRows: [],
    rowErrors,
    periodStart: null,
    periodEnd: null,
    intervalMinutes: null,
    digest: null,
    filename: null,
  }
  if (rowErrors.length) return preview
  if (kind === 'load_curve' && rows.length > MAX_LOAD_POINTS) {
    rowErrors.push(error(1, '时间', 'BATCH_TOO_LARGE', '时序负荷单批次最多 35,040 个数据点。'))
    return preview
  }

  const normalizers = { energy_monthly: energyRow, load_curve: loadRow, enterprises: enterpriseRow, projects: projectRow }
  preview.normalizedRows = rows.map((row, index) => normalizers[kind](row, index + 2, rowErrors))

  if (kind === 'energy_monthly') {
    const months = preview.normalizedRows.map((row) => row.reportMonth as string).filter(Boolean).sort()
    preview.periodStart = months.at(0) ?? null
    preview.periodEnd = months.at(-1) ?? null
  }
  if (kind === 'load_curve') {
    const timestamps = preview.normalizedRows.map((row) => row.recordedAt as string | null)
    const seen = new Set<string>()
    timestamps.forEach((timestamp, index) => {
      if (!timestamp) return
      if (seen.has(timestamp)) rowErrors.push(error(index + 2, '时间', 'DUPLICATE_TIMESTAMP', '同一批次的时间不能重复。'))
      seen.add(timestamp)
    })
    const uniqueTimes = [...seen].map((value) => Date.parse(value)).sort((a, b) => a - b)
    const intervals = new Set(uniqueTimes.slice(1).map((value, index) => (value - uniqueTimes[index]) / 60_000))
    if (intervals.size === 1 && ALLOWED_INTERVALS.has([...intervals][0])) {
      preview.intervalMinutes = [...intervals][0]
    } else if (uniqueTimes.length > 1) {
      rowErrors.push(error(1, '时间', 'UNSUPPORTED_INTERVAL', '时序间隔必须一致且为 15、30 或 60 分钟。'))
    }
    if (uniqueTimes.length) {
      preview.periodStart = new Date(uniqueTimes[0]).toISOString()
      preview.periodEnd = new Date(uniqueTimes.at(-1)!).toISOString()
    }
  }
  return preview
}

function workbookRows(sheet: XLSX.WorkSheet) {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null })
  const headers = (matrix[0] ?? []).map((value) => String(value ?? '').trim())
  const rows = matrix.slice(1)
    .filter((values) => values.some((value) => value !== null && value !== ''))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])))
  return { headers, rows }
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export async function parseImportFile(file: File, kind: ImportKind): Promise<ImportPreview> {
  if (file.size > MAX_FILE_BYTES) throw new Error('单文件不能超过 10 MB。')
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error('仅支持 XLSX 或 CSV 文件。')
  const bytes = await file.arrayBuffer()
  const preview = parseWorkbookBytes(bytes, kind)
  preview.digest = await sha256Hex(bytes)
  preview.filename = file.name
  return preview
}

export function parseWorkbookBytes(bytes: ArrayBuffer, kind: ImportKind): ImportPreview {
  const prefix = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength))
  const isZipWorkbook = prefix[0] === 0x50 && prefix[1] === 0x4b
  const workbook = isZipWorkbook
    ? XLSX.read(bytes, { type: 'array', cellDates: true, dense: false })
    : XLSX.read(new TextDecoder('utf-8').decode(bytes), { type: 'string', raw: true, cellDates: false, dense: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('工作簿没有可读取的数据表。')
  if (Object.values(sheet).some((cell) => typeof cell === 'object' && cell && 'f' in cell)) {
    throw new Error('导入模板不能包含公式，请粘贴为数值后重试。')
  }
  const { headers, rows } = workbookRows(sheet)
  return parseRows(kind, rows, headers)
}
