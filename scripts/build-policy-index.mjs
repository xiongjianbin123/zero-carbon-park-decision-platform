#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(scriptDir, '..')

function stableId(documentId, page, text) {
  const digest = createHash('sha1').update(text).digest('hex').slice(0, 10)
  return `${documentId}-p${page}-${digest}`
}

function splitLongParagraph(paragraph, maxChars) {
  if (paragraph.length <= maxChars) return [paragraph]
  const sentences = paragraph.split(/(?<=[。！？；])/).filter(Boolean)
  const pieces = []
  let current = ''
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > maxChars) {
      pieces.push(current)
      current = ''
    }
    if (sentence.length > maxChars) {
      for (let offset = 0; offset < sentence.length; offset += maxChars) {
        const slice = sentence.slice(offset, offset + maxChars)
        if (slice.length === maxChars || !current) pieces.push(slice)
        else current += slice
      }
    } else {
      current += sentence
    }
  }
  if (current) pieces.push(current)
  return pieces
}

export function chunkText(text, { documentId, maxChars = 900 } = {}) {
  if (!documentId) throw new Error('documentId is required')
  const chunks = []
  const pages = text
    .replace(/&(?:emsp|ensp|nbsp);/gi, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\f')

  pages.forEach((pageText, pageIndex) => {
    const paragraphs = pageText
      .split(/\n\s*\n/)
      .map((item) => item.replace(/[ \t]+/g, ' ').replace(/\n+/g, '\n').trim())
      .filter(Boolean)
      .flatMap((item) => splitLongParagraph(item, maxChars))
    let current = ''

    const flush = () => {
      const normalized = current.trim()
      if (!normalized) return
      const page = pageIndex + 1
      chunks.push({
        chunkId: stableId(documentId, page, normalized),
        documentId,
        page: `P.${page}`,
        text: normalized,
      })
      current = ''
    }

    for (const paragraph of paragraphs) {
      const separator = current ? '\n\n' : ''
      if (current && current.length + separator.length + paragraph.length > maxChars) flush()
      current += `${current ? '\n\n' : ''}${paragraph}`
    }
    flush()
  })

  return chunks
}

export async function buildIndex({
  catalogPath = resolve(projectDir, 'public/policies/catalog.json'),
  outputPath = resolve(projectDir, 'public/policies/index.json'),
  readText = (path) => readFile(path, 'utf8'),
} = {}) {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  const chunks = []

  for (const document of catalog) {
    if (!document.localText) continue
    const textPath = resolve(projectDir, 'public/policies', document.localText)
    try {
      const text = await readText(textPath)
      chunks.push(...chunkText(text, { documentId: document.id }))
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    chunks,
  }
  await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  return index
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const index = await buildIndex()
  console.log(`政策索引已生成：${index.chunks.length} 个片段`)
}
