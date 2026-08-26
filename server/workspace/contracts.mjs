export class WorkspaceError extends Error {
  constructor(code, message, status = 400, fieldErrors) {
    super(message)
    this.name = 'WorkspaceError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function workspaceJson(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
}

export async function readWorkspaceJson(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new WorkspaceError('INVALID_CONTENT_TYPE', '请求必须使用 application/json。', 415)
  }
  const text = await request.text()
  if (text.length > 64 * 1024) throw new WorkspaceError('REQUEST_TOO_LARGE', '请求内容超过限制。', 413)
  try {
    return JSON.parse(text || '{}')
  } catch {
    throw new WorkspaceError('INVALID_JSON', '请求内容不是有效的 JSON。', 400)
  }
}

export function cleanText(value, field, { min = 1, max = 200 } = {}) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length < min || text.length > max) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, {
      [field]: `请输入 ${min}—${max} 个字符。`,
    })
  }
  return text
}

export function cleanEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { email: '请输入有效邮箱。' })
  }
  return email
}

export function asYear(value, field) {
  const year = Number(value)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new WorkspaceError('VALIDATION_FAILED', '提交内容不符合要求。', 422, { [field]: '请输入 2000—2100 年。' })
  }
  return year
}

export function workspaceErrorResponse(error) {
  if (error instanceof WorkspaceError) {
    return workspaceJson({
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    }, error.status)
  }
  return workspaceJson({ code: 'INTERNAL_ERROR', message: '项目工作台暂时不可用。' }, 500)
}

