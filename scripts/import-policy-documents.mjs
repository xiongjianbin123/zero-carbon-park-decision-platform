#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(scriptDir, '..')
const policyDir = resolve(projectDir, 'public/policies')
const force = process.argv.includes('--force')

async function hasContent(path) {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function htmlToText(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

async function fetchOfficial(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'ZeroCarbonParkPolicyLibrary/1.0' },
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response
}

async function importDocument(document) {
  const textPath = document.localText ? resolve(policyDir, document.localText) : null
  if (!force && textPath && await hasContent(textPath)) return 'skipped'

  if (document.localFile) {
    const filePath = resolve(policyDir, document.localFile)
    await mkdir(dirname(filePath), { recursive: true })
    await mkdir(dirname(textPath), { recursive: true })
    if (force || !await hasContent(filePath)) {
      const response = await fetchOfficial(document.sourceUrl)
      await writeFile(filePath, Buffer.from(await response.arrayBuffer()))
    }
    await execFileAsync('/opt/homebrew/bin/pdftotext', ['-layout', filePath, textPath])
    return 'imported'
  }

  if (textPath) {
    await mkdir(dirname(textPath), { recursive: true })
    const response = await fetchOfficial(document.sourceUrl)
    await writeFile(textPath, `${htmlToText(await response.text())}\n`, 'utf8')
    return 'imported'
  }

  return 'metadata-only'
}

const catalog = JSON.parse(await readFile(resolve(policyDir, 'catalog.json'), 'utf8'))
const failures = []
let imported = 0
let skipped = 0

for (const document of catalog) {
  try {
    const result = await importDocument(document)
    if (result === 'imported') imported += 1
    if (result === 'skipped') skipped += 1
    console.log(`${result === 'skipped' ? '跳过' : '完成'}：${document.title}`)
  } catch (error) {
    failures.push(`${document.title}: ${error.message}`)
    console.error(`失败：${document.title}（${error.message}）`)
  }
}

console.log(`资料导入结束：新增/更新 ${imported}，跳过 ${skipped}，失败 ${failures.length}`)
if (failures.length) process.exitCode = 1
