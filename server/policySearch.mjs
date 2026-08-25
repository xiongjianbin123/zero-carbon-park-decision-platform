function normalize(value = '') {
  return String(value).normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function searchTerms(query) {
  const normalized = String(query).normalize('NFKC').toLowerCase()
  const terms = [...(normalized.match(/[a-z0-9]+(?:[./%-][a-z0-9]+)*/g) ?? [])]
  for (const sequence of normalized.match(/[\u3400-\u9fff]+/g) ?? []) {
    if (sequence.length <= 2) terms.push(sequence)
    for (let index = 0; index < sequence.length - 1; index += 1) terms.push(sequence.slice(index, index + 2))
  }
  return unique(terms)
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0
  let count = 0
  let offset = 0
  while ((offset = haystack.indexOf(needle, offset)) >= 0) {
    count += 1
    offset += needle.length
  }
  return count
}

function matchesFilters(document, filters = {}) {
  if (filters.levels?.length && !filters.levels.includes(document.level)) return false
  if (filters.categories?.length && !filters.categories.includes(document.category)) return false
  if (filters.statuses?.length && !filters.statuses.includes(document.status)) return false
  return true
}

export function createPolicySearch({ catalog, index }) {
  const documentsById = new Map(catalog.map((document) => [document.id, document]))

  function listDocuments(filters = {}) {
    return catalog
      .filter((document) => matchesFilters(document, filters))
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
  }

  function search(query, filters = {}, limit = 6) {
    const phrase = normalize(query)
    if (!phrase) return []
    const terms = searchTerms(query)
    const eligibleChunks = index.chunks.filter((chunk) => {
      const document = documentsById.get(chunk.documentId)
      return document && matchesFilters(document, filters)
    })
    const documentFrequency = new Map(terms.map((term) => [
      term,
      eligibleChunks.reduce((count, chunk) => count + Number(normalize(chunk.text).includes(normalize(term))), 0),
    ]))
    const ranked = []

    for (const chunk of eligibleChunks) {
      const document = documentsById.get(chunk.documentId)
      const title = normalize(document.title)
      const documentNumber = normalize(document.documentNumber)
      const tags = normalize(document.tags.join(' '))
      const issuers = normalize(document.issuers.join(' '))
      const summary = normalize(document.summary)
      const content = normalize(chunk.text)
      let score = 0

      if (title.includes(phrase)) score += 30
      if (documentNumber && documentNumber.includes(phrase)) score += 30
      if (tags.includes(phrase)) score += 20
      if (summary.includes(phrase)) score += 12
      if (content.includes(phrase)) score += 18

      for (const term of terms) {
        const normalizedTerm = normalize(term)
        const frequency = documentFrequency.get(term) ?? 0
        const idf = Math.log((eligibleChunks.length + 1) / (frequency + 1)) + 1
        if (title.includes(normalizedTerm)) score += 6
        if (tags.includes(normalizedTerm)) score += 5
        if (issuers.includes(normalizedTerm)) score += 3
        if (summary.includes(normalizedTerm)) score += 2
        score += Math.min(countOccurrences(content, normalizedTerm), 3) * idf
      }

      if (score <= 0) continue
      ranked.push({
        chunkId: chunk.chunkId,
        documentId: document.id,
        page: chunk.page,
        text: chunk.text,
        title: document.title,
        documentNumber: document.documentNumber,
        level: document.level,
        category: document.category,
        status: document.status,
        issuers: document.issuers,
        sourceUrl: document.sourceUrl,
        excerpt: chunk.text.slice(0, 520),
        score: Number(score.toFixed(4)),
      })
    }

    return ranked
      .sort((left, right) => right.score - left.score || left.chunkId.localeCompare(right.chunkId))
      .slice(0, Math.max(1, Math.min(limit, 20)))
      .map((result, resultIndex) => ({ ...result, evidenceId: `E${String(resultIndex + 1).padStart(2, '0')}` }))
  }

  return { listDocuments, search }
}
