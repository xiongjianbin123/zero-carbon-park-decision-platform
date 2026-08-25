import { describe, expect, it } from 'vitest'
import { parkConfig } from '../../src/config/park'
import { sumFunding, sumInvestment, validateParkConfig } from '../../src/utils/parkValidation'

describe('park configuration', () => {
  it('keeps investment and funding totals consistent', () => {
    expect(sumInvestment(parkConfig.investment.sectors)).toBe(67)
    expect(sumFunding(parkConfig.investment.fundingSources)).toBe(67)
  })

  it('resolves every QA metric reference', () => {
    expect(validateParkConfig(parkConfig)).toEqual([])
  })

  it('contains seven guided-tour stops and an operations question', () => {
    expect(parkConfig.tour).toHaveLength(7)
    expect(parkConfig.tour.map((stop) => stop.route)).toContain('/operations')
    expect(parkConfig.qa.some((item) => item.id === 'operation-value')).toBe(true)
  })

  it('contains three complete energy-operation scenarios', () => {
    expect(parkConfig.operations.scenarios).toHaveLength(3)
    for (const scenario of parkConfig.operations.scenarios) {
      expect(scenario.timeline).toHaveLength(24)
      expect(scenario.strategy.length).toBeGreaterThanOrEqual(3)
    }
    expect(parkConfig.operations.resources.length).toBeGreaterThanOrEqual(4)
    expect(parkConfig.operations.marketChannels.map((item) => item.name)).toEqual([
      '需求响应',
      '现货交易',
      '绿电交易',
    ])
  })

  it('contains the complete VPP operating chain', () => {
    expect(parkConfig.operations.vpp.stages.map((stage) => stage.id)).toEqual([
      'aggregation',
      'forecast',
      'response',
      'trading',
      'dispatch',
      'settlement',
    ])
  })
})
