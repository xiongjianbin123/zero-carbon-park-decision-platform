import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `你是零碳园区政策与项目咨询助手。只能使用用户消息中提供的政策证据和园区数据回答。
要求：
1. 区分真实政策事实与演示园区数据；
2. 证据不足时明确说出缺少哪些数据，不得补写不存在的文号、页码、日期或园区事实；
3. 回答采用“一句结论、关键依据、建议动作”的简洁结构；
4. 每条政策依据必须使用提供的证据编号，例如 [E01]；
5. 不输出内部思考过程。`

function appError(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined)
  error.code = code
  return error
}

function renderPrompt({ question, evidence, parkContext }) {
  const sources = evidence.map((item) => [
    `[${item.evidenceId}] ${item.title}${item.page ? ` · ${item.page}` : ''}`,
    item.excerpt,
  ].join('\n')).join('\n\n')

  return `问题：${question}\n\n园区数据（演示口径）：\n${parkContext || '未提供'}\n\n政策证据：\n${sources}`
}

function extractText(content) {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join('\n')
}

export function createMinimaxClient({
  apiKey = process.env.MINIMAX_API_KEY ?? '',
  baseURL = process.env.MINIMAX_BASE_URL ?? 'https://api.minimaxi.com/anthropic',
  model = process.env.MINIMAX_MODEL ?? 'MiniMax-M3',
  client,
} = {}) {
  const sdk = client ?? (apiKey ? new Anthropic({ apiKey, baseURL }) : null)

  async function answerQuestion({ question, evidence, parkContext = '' }) {
    if (!evidence?.length) throw appError('EVIDENCE_NOT_FOUND', '没有检索到足以回答该问题的政策证据。')
    if (!apiKey && !client) throw appError('MINIMAX_NOT_CONFIGURED', '智能问数尚未完成本机配置。')

    let response
    try {
      response = await sdk.messages.create({
        model,
        max_tokens: 1200,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: renderPrompt({ question, evidence, parkContext }) }],
      })
    } catch (cause) {
      throw appError('MINIMAX_UPSTREAM_ERROR', '智能问数服务暂时不可用，请稍后重试。', cause)
    }

    const answer = extractText(response.content ?? [])
    if (!answer) throw appError('MINIMAX_EMPTY_RESPONSE', '智能问数未返回可展示内容。')

    const citedIds = [...new Set(answer.match(/E\d{2}/g) ?? [])]
    const citations = evidence.filter((item) => citedIds.includes(item.evidenceId))
    return { answer, citations }
  }

  return { answerQuestion }
}
