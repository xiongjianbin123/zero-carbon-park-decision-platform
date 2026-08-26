import { parseWorkbookBytes } from '../../src/services/importWorkbook.ts'
import { requireOrgUser, requireParkRole } from './auth.mjs'
import { WorkspaceError } from './contracts.mjs'

const IMPORT_KINDS = new Set(['energy_monthly', 'load_curve', 'enterprises', 'projects'])
const WRITE_ROLES = ['admin', 'manager', 'specialist']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const BATCH_SIZE = 400

function safeFilename(filename) {
  const cleaned = String(filename || 'import')
    .normalize('NFKC')
    .replace(/[\\/\u0000-\u001f\u007f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  return cleaned || 'import'
}

function importShape(row) {
  return {
    id: row.id,
    kind: row.import_type,
    filename: row.original_filename,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    intervalMinutes: row.interval_minutes,
    acceptedRows: row.accepted_rows,
    rejectedRows: row.rejected_rows,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function parseMetadata(value) {
  if (!value) return {}
  try {
    const metadata = JSON.parse(String(value))
    return metadata && typeof metadata === 'object' ? metadata : {}
  } catch {
    throw new WorkspaceError('INVALID_METADATA', '导入元数据不是有效 JSON。', 422)
  }
}

async function readImportForm(request) {
  if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
    throw new WorkspaceError('INVALID_CONTENT_TYPE', '导入请求必须使用 multipart/form-data。', 415)
  }
  const form = await request.formData()
  const kind = String(form.get('kind') ?? '')
  const file = form.get('file')
  if (!IMPORT_KINDS.has(kind)) throw new WorkspaceError('INVALID_IMPORT_KIND', '请选择有效导入模板。', 422)
  if (!(file instanceof File)) throw new WorkspaceError('FILE_REQUIRED', '请选择要导入的 XLSX 或 CSV 文件。', 422)
  if (file.size > MAX_FILE_BYTES) throw new WorkspaceError('FILE_TOO_LARGE', '单文件不能超过 10 MB。', 413)
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new WorkspaceError('INVALID_FILE_TYPE', '仅支持 XLSX 或 CSV 文件。', 422)
  return { kind, file, metadata: parseMetadata(form.get('metadata')) }
}

function statementForRow(db, { kind, row, parkId, importId, intervalMinutes, id, timestamp }) {
  if (kind === 'energy_monthly') {
    return db.prepare(`INSERT INTO energy_monthly
      (id, park_id, import_id, report_month, electricity_kwh, electricity_cost_yuan, green_electricity_kwh, natural_gas_m3, heat_gj, steam_t)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, parkId, importId, row.reportMonth, row.electricityKwh, row.electricityCostYuan, row.greenElectricityKwh, row.naturalGasM3, row.heatGj, row.steamT)
  }
  if (kind === 'load_curve') {
    return db.prepare(`INSERT INTO load_curve_points
      (id, park_id, import_id, recorded_at, load_kw, solar_kw, storage_charge_kw, storage_discharge_kw, interval_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, parkId, importId, row.recordedAt, row.loadKw, row.solarKw, row.storageChargeKw, row.storageDischargeKw, intervalMinutes)
  }
  if (kind === 'enterprises') {
    return db.prepare(`INSERT INTO enterprises
      (id, park_id, import_id, name, industry, annual_output_ten_thousand_yuan, comprehensive_energy_tce, annual_electricity_kwh, key_energy_consumer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, parkId, importId, row.name, row.industry, row.annualOutputTenThousandYuan, row.comprehensiveEnergyTce, row.annualElectricityKwh, row.keyEnergyConsumer ? 1 : 0)
  }
  return db.prepare(`INSERT INTO park_projects
    (id, park_id, import_id, name, project_type, status, investment_ten_thousand_yuan, capacity_value, capacity_unit, planned_start_date, planned_operation_date, expected_reduction_tco2e, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, parkId, importId, row.name, row.projectType, row.status, row.investmentTenThousandYuan, row.capacityValue, row.capacityUnit, row.plannedStartDate, row.plannedOperationDate, row.expectedReductionTco2e, timestamp, timestamp)
}

async function deleteNormalizedRows(db, importId) {
  for (const table of ['energy_monthly', 'load_curve_points', 'enterprises', 'park_projects']) {
    await db.prepare(`DELETE FROM ${table} WHERE import_id = ?`).bind(importId).run()
  }
}

async function audit(db, deps, parkId, userId, importId, result, summary) {
  await db.prepare(`INSERT INTO audit_logs
    (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
    VALUES (?, ?, ?, 'import.commit', 'import', ?, ?, ?, ?)`)
    .bind(deps.id(), parkId, userId, importId, result, summary.slice(0, 300), deps.now()).run()
}

export function createImportService({ db, files, env, deps }) {
  return {
    async list(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const result = await db.prepare(`SELECT * FROM imports WHERE park_id = ? ORDER BY created_at DESC, id DESC`)
        .bind(parkId).all()
      return result.results.map(importShape)
    },

    async commit(identity, parkId, request) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      const importId = deps.id()
      let form
      try {
        form = await readImportForm(request)
      } catch (error) {
        await audit(db, deps, parkId, user.id, importId, 'failed', '导入请求校验失败')
        throw error
      }
      const { kind, file, metadata } = form
      const bytes = await file.arrayBuffer()
      let preview
      try {
        preview = parseWorkbookBytes(bytes, kind)
      } catch {
        await audit(db, deps, parkId, user.id, importId, 'failed', '导入文件解析失败')
        throw new WorkspaceError('IMPORT_PARSE_FAILED', '文件无法按所选模板读取。', 422)
      }
      if (!preview.normalizedRows.length || preview.rowErrors.length) {
        await audit(db, deps, parkId, user.id, importId, 'failed', `导入数据校验失败:${preview.rowErrors.length}`)
        throw new WorkspaceError('IMPORT_VALIDATION_FAILED', '文件中存在未通过校验的数据。', 422, {
          rows: preview.rowErrors.slice(0, 100),
        })
      }

      const digest = await sha256Hex(bytes)
      const duplicate = await db.prepare(`SELECT * FROM imports
        WHERE park_id = ? AND import_type = ? AND file_digest = ? AND status = 'succeeded'`)
        .bind(parkId, kind, digest).first()
      if (duplicate && metadata.replaceImportId !== duplicate.id) {
        await audit(db, deps, parkId, user.id, importId, 'failed', '重复导入未确认替换')
        throw new WorkspaceError('DUPLICATE_IMPORT', '相同文件已经导入，请明确选择替换或取消。', 409)
      }

      const timestamp = deps.now()
      const filename = safeFilename(file.name)
      const r2Key = `parks/${parkId}/imports/${importId}/${filename}`
      let pendingCreated = false
      let r2Created = false
      try {
        await db.prepare(`INSERT INTO imports
          (id, park_id, import_type, original_filename, content_type, file_size, file_digest, r2_key, period_start, period_end, interval_minutes, accepted_rows, rejected_rows, status, imported_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)`)
          .bind(importId, parkId, kind, file.name.slice(0, 240), file.type || 'application/octet-stream', file.size, digest, r2Key, preview.periodStart, preview.periodEnd, preview.intervalMinutes, preview.normalizedRows.length, user.id, timestamp).run()
        pendingCreated = true
        await files.put(r2Key, bytes, {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
          customMetadata: { importId, parkId },
        })
        r2Created = true

        const statements = preview.normalizedRows.map((row) => statementForRow(db, {
          kind, row, parkId, importId, intervalMinutes: preview.intervalMinutes, id: deps.id(), timestamp,
        }))
        for (let index = 0; index < statements.length; index += BATCH_SIZE) {
          await db.batch(statements.slice(index, index + BATCH_SIZE))
        }

        const completion = [
          ...(duplicate ? [db.prepare(`UPDATE imports SET status = 'replaced' WHERE id = ? AND park_id = ?`).bind(duplicate.id, parkId)] : []),
          db.prepare(`UPDATE imports SET status = 'succeeded', completed_at = ? WHERE id = ? AND park_id = ?`).bind(deps.now(), importId, parkId),
        ]
        await db.batch(completion)

        if (duplicate) {
          await deleteNormalizedRows(db, duplicate.id)
          await files.delete(duplicate.r2_key)
        }
        await audit(db, deps, parkId, user.id, importId, 'succeeded', `${kind}:${preview.normalizedRows.length}`)
        const stored = await db.prepare('SELECT * FROM imports WHERE id = ? AND park_id = ?').bind(importId, parkId).first()
        return importShape(stored)
      } catch (error) {
        await deleteNormalizedRows(db, importId)
        if (pendingCreated) await db.prepare('DELETE FROM imports WHERE id = ? AND park_id = ?').bind(importId, parkId).run()
        if (r2Created) await files.delete(r2Key)
        await audit(db, deps, parkId, user.id, importId, 'failed', '导入写入失败')
        if (error instanceof WorkspaceError) throw error
        throw new WorkspaceError('IMPORT_COMMIT_FAILED', '导入未完成，已撤销本次写入。', 500)
      }
    },
  }
}
