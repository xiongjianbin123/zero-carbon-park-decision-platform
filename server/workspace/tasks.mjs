import { requireOrgUser, requireParkRole } from './auth.mjs'
import { WorkspaceError, cleanText } from './contracts.mjs'

const TASK_STATUSES = ['draft', 'open', 'in_progress', 'blocked', 'done']
const WRITE_ROLES = ['admin', 'manager', 'specialist']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_FILES = new Map([
  ['.xlsx', ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream']],
  ['.csv', ['text/csv', 'application/vnd.ms-excel', 'text/plain']],
  ['.pdf', ['application/pdf']],
  ['.png', ['image/png']],
  ['.jpg', ['image/jpeg']],
  ['.jpeg', ['image/jpeg']],
])

export function canTransitionTask(_current, next) {
  return TASK_STATUSES.includes(next)
}

export function validateTaskCompletion({ evidenceCount, reviewNote }) {
  if (evidenceCount < 1 && !String(reviewNote || '').trim()) {
    throw new WorkspaceError('TASK_EVIDENCE_REQUIRED', '任务完成前须上传至少一份佐证材料或填写审核备注。', 422)
  }
}

function cleanDate(value, field = 'plannedDate') {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { [field]: '请输入有效的 YYYY-MM-DD 日期。' })
  }
  return text
}

function cleanStatus(value) {
  if (!TASK_STATUSES.includes(value)) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { status: '请选择有效任务状态。' })
  }
  return value
}

function taskShape(row) {
  return {
    id: row.id,
    parkId: row.park_id,
    sourceIndicatorId: row.source_indicator_id,
    taskType: row.task_type,
    title: row.title,
    ownerName: row.owner_name,
    plannedDate: row.planned_date,
    status: row.status,
    reviewNote: row.review_note,
    evidenceCount: Number(row.evidence_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fileShape(row) {
  return {
    id: row.id,
    parkId: row.park_id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    filename: row.original_filename,
    contentType: row.content_type,
    size: row.file_size,
    checksum: row.checksum,
    validationSummary: row.validation_summary,
    uploadedAt: row.uploaded_at,
  }
}

function activityShape(row) {
  return {
    id: row.id,
    action: row.action,
    result: row.result,
    summary: row.summary,
    createdAt: row.created_at,
  }
}

function safeFilename(filename) {
  const cleaned = String(filename || 'file')
    .normalize('NFKC')
    .replace(/[\\/\u0000-\u001f\u007f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  return cleaned || 'file'
}

function extension(filename) {
  const match = String(filename).toLowerCase().match(/\.[a-z0-9]+$/)
  return match?.[0] ?? ''
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function audit(db, deps, { parkId, userId, action, objectType, objectId, result = 'succeeded', summary = '' }) {
  await db.prepare(`INSERT INTO audit_logs
    (id, park_id, user_id, action, object_type, object_id, result, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(deps.id(), parkId, userId, action, objectType, objectId, result, summary.slice(0, 300), deps.now()).run()
}

async function findTask(db, parkId, taskId) {
  return db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM files f WHERE f.park_id = t.park_id AND f.owner_type = 'task' AND f.owner_id = t.id) AS evidence_count
    FROM tasks t WHERE t.park_id = ? AND t.id = ?`)
    .bind(parkId, taskId).first()
}

export function createTaskFileService({ db, files, env, deps }) {
  return {
    async listTasks(identity, parkId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const result = await db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM files f WHERE f.park_id = t.park_id AND f.owner_type = 'task' AND f.owner_id = t.id) AS evidence_count
        FROM tasks t WHERE t.park_id = ? ORDER BY t.planned_date, t.created_at`)
        .bind(parkId).all()
      return result.results.map(taskShape)
    },

    async listTaskActivity(identity, parkId, taskId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      if (!await findTask(db, parkId, taskId)) throw new WorkspaceError('TASK_NOT_FOUND', '未找到该任务。', 404)
      const result = await db.prepare(`SELECT * FROM audit_logs
        WHERE park_id = ? AND ((object_type = 'task' AND object_id = ?) OR (object_type = 'file' AND summary = ?))
        ORDER BY created_at DESC, rowid DESC`)
        .bind(parkId, taskId, `task:${taskId}`).all()
      return result.results.map(activityShape)
    },

    async createTask(identity, parkId, body) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      const status = cleanStatus(body.status ?? 'draft')
      const reviewNote = typeof body.reviewNote === 'string' ? body.reviewNote.trim().slice(0, 2000) : ''
      if (status === 'done') validateTaskCompletion({ evidenceCount: 0, reviewNote })
      let sourceIndicatorId = null
      if (body.sourceIndicatorId) {
        const indicator = await db.prepare('SELECT id, status FROM indicator_results WHERE id = ? AND park_id = ?')
          .bind(body.sourceIndicatorId, parkId).first()
        if (!indicator || !['gap', 'missing_data'].includes(indicator.status)) {
          throw new WorkspaceError('INVALID_TASK_SOURCE', '任务只能从本园区的差距或缺数指标生成。', 422)
        }
        sourceIndicatorId = indicator.id
      }
      const id = deps.id()
      const timestamp = deps.now()
      await db.prepare(`INSERT INTO tasks
        (id, park_id, source_indicator_id, task_type, title, owner_name, planned_date, status, review_note, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, parkId, sourceIndicatorId, cleanText(body.taskType, 'taskType', { max: 80 }), cleanText(body.title, 'title', { max: 200 }), cleanText(body.ownerName, 'ownerName', { max: 100 }), cleanDate(body.plannedDate), status, reviewNote, user.id, timestamp, timestamp).run()
      await audit(db, deps, { parkId, userId: user.id, action: 'task.create', objectType: 'task', objectId: id, summary: status })
      return taskShape(await findTask(db, parkId, id))
    },

    async updateTask(identity, parkId, taskId, body) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      const current = await findTask(db, parkId, taskId)
      if (!current) throw new WorkspaceError('TASK_NOT_FOUND', '未找到该任务。', 404)
      const status = body.status === undefined ? current.status : cleanStatus(body.status)
      if (!canTransitionTask(current.status, status)) throw new WorkspaceError('INVALID_TASK_TRANSITION', '不允许执行该任务状态变更。', 422)
      const reviewNote = body.reviewNote === undefined ? current.review_note : String(body.reviewNote || '').trim().slice(0, 2000)
      if (status === 'done') validateTaskCompletion({ evidenceCount: Number(current.evidence_count), reviewNote })
      const taskType = body.taskType === undefined ? current.task_type : cleanText(body.taskType, 'taskType', { max: 80 })
      const title = body.title === undefined ? current.title : cleanText(body.title, 'title', { max: 200 })
      const ownerName = body.ownerName === undefined ? current.owner_name : cleanText(body.ownerName, 'ownerName', { max: 100 })
      const plannedDate = body.plannedDate === undefined ? current.planned_date : cleanDate(body.plannedDate)
      await db.prepare(`UPDATE tasks SET task_type = ?, title = ?, owner_name = ?, planned_date = ?, status = ?, review_note = ?, updated_at = ?
        WHERE id = ? AND park_id = ?`)
        .bind(taskType, title, ownerName, plannedDate, status, reviewNote, deps.now(), taskId, parkId).run()
      await audit(db, deps, {
        parkId, userId: user.id, action: 'task.update', objectType: 'task', objectId: taskId,
        summary: JSON.stringify({ before: current.status, after: status, note: reviewNote.slice(0, 120) }),
      })
      return taskShape(await findTask(db, parkId, taskId))
    },

    async uploadFile(identity, parkId, request) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user, WRITE_ROLES)
      if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
        throw new WorkspaceError('INVALID_CONTENT_TYPE', '文件上传必须使用 multipart/form-data。', 415)
      }
      const form = await request.formData()
      const ownerType = String(form.get('ownerType') ?? '')
      const ownerId = String(form.get('ownerId') ?? '')
      const file = form.get('file')
      if (ownerType !== 'task') throw new WorkspaceError('INVALID_FILE_OWNER', 'P0 佐证材料必须关联任务。', 422)
      if (!(file instanceof File)) throw new WorkspaceError('FILE_REQUIRED', '请选择佐证文件。', 422)
      const task = await findTask(db, parkId, ownerId)
      if (!task) throw new WorkspaceError('TASK_NOT_FOUND', '未找到该任务。', 404)
      if (file.size > MAX_FILE_BYTES) throw new WorkspaceError('FILE_TOO_LARGE', '单文件不能超过 10 MB。', 413)
      const ext = extension(file.name)
      if (!ALLOWED_FILES.has(ext) || !ALLOWED_FILES.get(ext).includes(file.type || 'application/octet-stream')) {
        throw new WorkspaceError('INVALID_FILE_TYPE', '仅支持 XLSX、CSV、PDF、PNG 和 JPEG 文件。', 422)
      }
      const id = deps.id()
      const timestamp = deps.now()
      const filename = safeFilename(file.name)
      const r2Key = `parks/${parkId}/evidence/${id}/${filename}`
      const bytes = await file.arrayBuffer()
      const checksum = await sha256Hex(bytes)
      let uploaded = false
      try {
        await files.put(r2Key, bytes, { httpMetadata: { contentType: file.type }, customMetadata: { parkId, fileId: id } })
        uploaded = true
        await db.prepare(`INSERT INTO files
          (id, park_id, owner_type, owner_id, r2_key, original_filename, content_type, file_size, checksum, validation_summary, uploaded_by, uploaded_at)
          VALUES (?, ?, 'task', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, parkId, ownerId, r2Key, file.name.slice(0, 240), file.type, file.size, checksum, '文件类型与大小校验通过', user.id, timestamp).run()
      } catch {
        if (uploaded) await files.delete(r2Key)
        await audit(db, deps, { parkId, userId: user.id, action: 'file.upload', objectType: 'file', objectId: id, result: 'failed', summary: '文件元数据写入失败' })
        throw new WorkspaceError('FILE_COMMIT_FAILED', '文件上传未完成，已撤销本次写入。', 500)
      }
      await audit(db, deps, { parkId, userId: user.id, action: 'file.upload', objectType: 'file', objectId: id, summary: `${ownerType}:${ownerId}` })
      return fileShape(await db.prepare('SELECT * FROM files WHERE id = ? AND park_id = ?').bind(id, parkId).first())
    },

    async listFiles(identity, parkId, { ownerType, ownerId }) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      if (ownerType !== 'task' || !ownerId) throw new WorkspaceError('INVALID_FILE_FILTER', '请选择有效的佐证归属。', 422)
      if (!await findTask(db, parkId, ownerId)) throw new WorkspaceError('TASK_NOT_FOUND', '未找到该任务。', 404)
      const result = await db.prepare(`SELECT * FROM files
        WHERE park_id = ? AND owner_type = ? AND owner_id = ? ORDER BY uploaded_at DESC, rowid DESC`)
        .bind(parkId, ownerType, ownerId).all()
      return result.results.map(fileShape)
    },

    async downloadFile(identity, parkId, fileId) {
      const user = await requireOrgUser(db, identity, env, deps)
      await requireParkRole(db, parkId, user)
      const metadata = await db.prepare('SELECT * FROM files WHERE id = ? AND park_id = ?').bind(fileId, parkId).first()
      if (!metadata) throw new WorkspaceError('FILE_NOT_FOUND', '未找到该文件。', 404)
      const object = await files.get(metadata.r2_key)
      if (!object) throw new WorkspaceError('FILE_CONTENT_NOT_FOUND', '文件内容暂时不可用。', 404)
      return new Response(object.body, {
        headers: {
          'content-type': metadata.content_type,
          'content-length': String(metadata.file_size),
          'content-disposition': `attachment; filename="download${extension(metadata.original_filename)}"; filename*=UTF-8''${encodeURIComponent(metadata.original_filename)}`,
          'cache-control': 'private, no-store',
        },
      })
    },
  }
}
