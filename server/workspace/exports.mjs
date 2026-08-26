import * as XLSX from 'xlsx'
import { buildExportSnapshot } from '../../src/services/deliverableModel.ts'
import { requireOrgUser, requireParkRole } from './auth.mjs'
import { WorkspaceError } from './contracts.mjs'

const EXPORT_TYPES = new Set(['diagnosis_report', 'task_register', 'project_investment', 'evidence_catalog'])
const WRITE_ROLES = ['admin', 'manager', 'specialist']
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function exportShape(row) {
  return {
    id: row.id,
    parkId: row.park_id,
    type: row.export_type,
    dataBaselineDate: row.data_baseline_date,
    indicatorVersion: row.indicator_version,
    snapshot: JSON.parse(row.snapshot_json),
    summary: row.snapshot_summary,
    downloadAvailable: Boolean(row.r2_key),
    generatedAt: row.generated_at,
  }
}

function safeFilename(filename) {
  return filename.replace(/[\\/\u0000-\u001f\u007f]+/g, '-').slice(0, 160)
}

function parkShape(row) {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    parkType: row.park_type,
    baselineYear: row.baseline_year,
    targetYear: row.target_year,
    applicationDirection: row.application_direction,
  }
}

function parseArray(value) {
  try { return JSON.parse(value || '[]') } catch { return [] }
}

async function latestDiagnosis(db, parkId) {
  const latest = await db.prepare('SELECT diagnosis_run_id FROM indicator_results WHERE park_id = ? ORDER BY rowid DESC LIMIT 1')
    .bind(parkId).first()
  if (!latest) return null
  const rows = await db.prepare('SELECT * FROM indicator_results WHERE park_id = ? AND diagnosis_run_id = ? ORDER BY rowid')
    .bind(parkId, latest.diagnosis_run_id).all()
  const results = rows.results.map((row) => ({
    id: row.id,
    key: row.indicator_key,
    currentValue: row.current_value,
    targetValue: row.target_value,
    unit: row.unit,
    status: row.status,
    calculationNote: row.calculation_note,
    inputImportIds: parseArray(row.input_import_ids),
    missingData: parseArray(row.missing_data),
  }))
  return {
    version: rows.results[0].indicator_version,
    missingData: [...new Set(results.flatMap((item) => item.missingData))],
    results,
  }
}

async function snapshotForPark(db, parkId, generatedAt) {
  const park = await db.prepare('SELECT * FROM parks WHERE id = ?').bind(parkId).first()
  if (!park) throw new WorkspaceError('PARK_NOT_FOUND', '未找到该园区。', 404)
  const [baseline, diagnosis, tasks, projects, files] = await Promise.all([
    db.prepare(`SELECT COALESCE(MAX(period_end), ?) AS value FROM imports WHERE park_id = ? AND status = 'succeeded'`)
      .bind(park.data_baseline_date, parkId).first('value'),
    latestDiagnosis(db, parkId),
    db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM files f WHERE f.park_id = t.park_id AND f.owner_type = 'task' AND f.owner_id = t.id) AS evidence_count
      FROM tasks t WHERE t.park_id = ? ORDER BY t.planned_date, t.created_at`).bind(parkId).all(),
    db.prepare('SELECT * FROM park_projects WHERE park_id = ? ORDER BY planned_start_date, name').bind(parkId).all(),
    db.prepare('SELECT * FROM files WHERE park_id = ? ORDER BY uploaded_at, original_filename').bind(parkId).all(),
  ])
  return buildExportSnapshot({
    park: parkShape(park),
    dataBaselineDate: baseline,
    diagnosis,
    tasks: tasks.results.map((row) => ({
      id: row.id, title: row.title, taskType: row.task_type, ownerName: row.owner_name,
      plannedDate: row.planned_date, status: row.status, reviewNote: row.review_note,
      evidenceCount: Number(row.evidence_count),
    })),
    projects: projects.results.map((row) => ({
      id: row.id, name: row.name, projectType: row.project_type, status: row.status,
      investmentTenThousandYuan: row.investment_ten_thousand_yuan, capacityValue: row.capacity_value,
      capacityUnit: row.capacity_unit, plannedStartDate: row.planned_start_date,
      plannedOperationDate: row.planned_operation_date, expectedReductionTco2e: row.expected_reduction_tco2e,
    })),
    files: files.results.map((row) => ({
      id: row.id, ownerType: row.owner_type, ownerId: row.owner_id, filename: row.original_filename,
      contentType: row.content_type, size: row.file_size, checksum: row.checksum, uploadedAt: row.uploaded_at,
    })),
    generatedAt,
  })
}

function metadataRows(snapshot) {
  return [
    ['园区名称', snapshot.park.name],
    ['所在地区', snapshot.park.region],
    ['数据基准日', snapshot.dataBaselineDate ?? '未形成'],
    ['指标版本', snapshot.indicatorVersion ?? '未形成'],
    ['生成时间', snapshot.generatedAt],
    ['数据缺口', snapshot.missingData.join('、') || '无'],
  ]
}

function buildWorkbook(type, snapshot) {
  const workbook = XLSX.utils.book_new()
  const metadata = XLSX.utils.aoa_to_sheet([['成果元数据', '内容'], ...metadataRows(snapshot)])
  XLSX.utils.book_append_sheet(workbook, metadata, '成果说明')
  if (type === 'task_register') {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['任务标题', '任务类型', '责任人', '计划日期', '状态', '审核备注', '佐证数量'],
      ...snapshot.tasks.map((item) => [item.title, item.taskType, item.ownerName, item.plannedDate, item.status, item.reviewNote, item.evidenceCount]),
    ]), '任务表')
  } else if (type === 'project_investment') {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['项目名称', '类型', '状态', '投资万元', '容量', '容量单位', '计划开工', '计划投产', '预期减排tCO₂e'],
      ...snapshot.projects.map((item) => [item.name, item.projectType, item.status, item.investmentTenThousandYuan, item.capacityValue, item.capacityUnit, item.plannedStartDate, item.plannedOperationDate, item.expectedReductionTco2e]),
    ]), '项目投资清单')
  } else {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['文件名称', '归属类型', '归属对象', '文件类型', '文件大小Byte', '校验摘要', '上传时间'],
      ...snapshot.files.map((item) => [item.filename, item.ownerType, item.ownerId, item.contentType, item.size, item.checksum, item.uploadedAt]),
    ]), '佐证材料目录')
  }
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true })
}

function filenameFor(type, snapshot) {
  const suffix = { task_register: '建设与申报任务表', project_investment: '项目投资清单', evidence_catalog: '申报佐证材料目录' }[type]
  return safeFilename(`${snapshot.park.name}-${suffix}-${snapshot.generatedAt.slice(0, 10)}.xlsx`)
}

async function audit(db, deps, parkId, userId, exportId, result, summary) {
  await db.prepare(`INSERT INTO audit_logs
    (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
    VALUES (?, ?, ?, 'export.generate', 'export', ?, ?, ?, ?)`)
    .bind(deps.id(), parkId, userId, exportId, result, summary.slice(0, 300), deps.now()).run()
}

export function createExportService({ db, files, env, deps }) {
  return {
    async generate(identity, parkId, body) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      if (!EXPORT_TYPES.has(body.type)) throw new WorkspaceError('INVALID_EXPORT_TYPE', '请选择有效成果类型。', 422)
      const snapshot = await snapshotForPark(db, parkId, deps.now())
      const preview = {
        type: body.type,
        snapshot,
        recordCount: body.type === 'task_register' ? snapshot.tasks.length
          : body.type === 'project_investment' ? snapshot.projects.length
            : body.type === 'evidence_catalog' ? snapshot.files.length
              : snapshot.diagnosisResults.length,
      }
      if (body.confirmed !== true) return { preview, exported: null }

      const id = deps.id()
      let r2Key = null
      try {
        if (body.type !== 'diagnosis_report') {
          const filename = filenameFor(body.type, snapshot)
          r2Key = `parks/${parkId}/exports/${id}/${filename}`
          await files.put(r2Key, buildWorkbook(body.type, snapshot), { httpMetadata: { contentType: XLSX_TYPE }, customMetadata: { parkId, exportId: id } })
        }
        await db.prepare(`INSERT INTO exports
          (id, park_id, export_type, data_baseline_date, indicator_version, snapshot_json, snapshot_summary, r2_key, generated_by, generated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, parkId, body.type, snapshot.dataBaselineDate, snapshot.indicatorVersion, JSON.stringify(snapshot), `${snapshot.park.name}:${preview.recordCount}`, r2Key, user.id, snapshot.generatedAt).run()
      } catch {
        if (r2Key) await files.delete(r2Key)
        await audit(db, deps, parkId, user.id, id, 'failed', body.type)
        throw new WorkspaceError('EXPORT_COMMIT_FAILED', '成果生成未完成，已撤销本次写入。', 500)
      }
      await audit(db, deps, parkId, user.id, id, 'succeeded', body.type)
      const stored = await db.prepare('SELECT * FROM exports WHERE id = ? AND park_id = ?').bind(id, parkId).first()
      return { preview, exported: exportShape(stored) }
    },

    async get(identity, parkId, exportId, download) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const row = await db.prepare('SELECT * FROM exports WHERE id = ? AND park_id = ?').bind(exportId, parkId).first()
      if (!row) throw new WorkspaceError('EXPORT_NOT_FOUND', '未找到该成果。', 404)
      if (!download || !row.r2_key) return { response: null, exported: exportShape(row) }
      const object = await files.get(row.r2_key)
      if (!object) throw new WorkspaceError('EXPORT_CONTENT_NOT_FOUND', '成果文件暂时不可用。', 404)
      const filename = filenameFor(row.export_type, JSON.parse(row.snapshot_json))
      return {
        exported: null,
        response: new Response(object.body, {
          headers: {
            'content-type': XLSX_TYPE,
            'content-length': String(object.size),
            'content-disposition': `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
            'cache-control': 'private, no-store',
          },
        }),
      }
    },
  }
}

