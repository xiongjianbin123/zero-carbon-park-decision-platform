import { describe, expect, it } from 'vitest'
import catalog from '../../public/policies/catalog.json'

describe('policy catalog', () => {
  it('contains at least 12 unique official documents with explicit status', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(12)
    expect(new Set(catalog.map((item) => item.id)).size).toBe(catalog.length)

    for (const item of catalog) {
      expect(item.sourceUrl).toMatch(/^https:\/\//)
      expect(['effective', 'trial', 'drafting', 'repealed']).toContain(item.status)
      expect(item.issuers.length).toBeGreaterThan(0)
      expect(item.tags.length).toBeGreaterThan(0)
    }
  })

  it('separates real policy facts from the demonstration park configuration', () => {
    expect(catalog.some((item) => item.id === 'national-zero-carbon-notice-2025')).toBe(true)
    expect(catalog.some((item) => item.level === 'shanxi')).toBe(true)
    expect(catalog.some((item) => item.status === 'drafting')).toBe(true)
    expect(JSON.stringify(catalog)).not.toContain('晋北资源型工业零碳示范园区')
  })
})
