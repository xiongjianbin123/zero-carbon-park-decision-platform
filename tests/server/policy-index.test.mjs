import assert from 'node:assert/strict'
import test from 'node:test'
import { chunkText } from '../../scripts/build-policy-index.mjs'

test('chunkText keeps document and page identity', () => {
  const chunks = chunkText('第一页内容足够形成一个片段。\f第二页清洁能源消费占比不低于90%。', {
    documentId: 'indicator-system',
    maxChars: 30,
  })

  assert.equal(chunks[1].documentId, 'indicator-system')
  assert.equal(chunks[1].page, 'P.2')
  assert.match(chunks[1].text, /清洁能源/)
  assert.match(chunks[1].chunkId, /^indicator-system-p2-/)
})

test('chunkText joins short paragraphs without crossing a page', () => {
  const chunks = chunkText('第一段。\n\n第二段。\f第三段。', {
    documentId: 'notice',
    maxChars: 100,
  })

  assert.equal(chunks.length, 2)
  assert.match(chunks[0].text, /第一段。.*第二段。/s)
  assert.equal(chunks[1].page, 'P.2')
})

test('chunkText removes leftover HTML spacing entities from imported pages', () => {
  const chunks = chunkText('&emsp;&emsp;绿电直连支持园区清洁替代。', {
    documentId: 'green-direct',
  })

  assert.equal(chunks[0].text, '绿电直连支持园区清洁替代。')
})
