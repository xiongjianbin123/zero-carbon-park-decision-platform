import { describe, expect, it } from 'vitest'
import { INDICATOR_DEFINITIONS, INDICATOR_VERSION } from '@/config/indicatorDefinitions'

describe('deterministic park indicator definitions', () => {
  it('keeps stable unique keys and an explicit version', () => {
    expect(INDICATOR_VERSION).toBe('p0.1')
    expect(INDICATOR_DEFINITIONS).toHaveLength(6)
    expect(new Set(INDICATOR_DEFINITIONS.map((item) => item.key)).size).toBe(6)
  })

})
