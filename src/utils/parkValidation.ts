import type { FundingSource, InvestmentSector, ParkConfig } from '../types/park'

const rounded = (value: number): number => Math.round(value * 100) / 100

export function sumInvestment(items: readonly InvestmentSector[]): number {
  return rounded(items.reduce((total, item) => total + item.amount, 0))
}

export function sumFunding(items: readonly FundingSource[]): number {
  return rounded(items.reduce((total, item) => total + item.amount, 0))
}

export function validateParkConfig(config: Readonly<ParkConfig>): string[] {
  const errors: string[] = []
  const investmentTotal = sumInvestment(config.investment.sectors)
  const fundingTotal = sumFunding(config.investment.fundingSources)
  if (investmentTotal !== 67) errors.push(`investment.sectors total is ${investmentTotal}, expected 67`)
  if (fundingTotal !== 67) errors.push(`investment.fundingSources total is ${fundingTotal}, expected 67`)

  const metricIds = new Set([
    ...config.overview.metrics,
    ...config.roadmap.metrics,
    ...config.projects.metrics,
    ...config.policies.metrics,
    ...config.investment.metrics,
    ...config.operations.scenarios.flatMap((scenario) => scenario.metrics),
  ].map((item) => item.id))
  for (const item of config.qa) {
    for (const ref of item.metricRefs) {
      if (!metricIds.has(ref)) errors.push(`qa.${item.id} references unknown metric ${ref}`)
    }
  }

  const expectedRoutes = ['/dashboard', '/roadmap', '/projects', '/policies', '/investment', '/operations', '/qa']
  const actualRoutes = config.tour.map((stop) => stop.route)
  if (actualRoutes.length !== expectedRoutes.length || expectedRoutes.some((route) => !actualRoutes.includes(route))) {
    errors.push('tour routes must cover the seven product pages exactly once')
  }
  if (config.operations.scenarios.length !== 3) errors.push('operations.scenarios must contain three scenarios')
  for (const scenario of config.operations.scenarios) {
    if (scenario.timeline.length !== 24) errors.push(`operations.${scenario.id} must contain 24 hourly points`)
    for (const riskId of scenario.riskIds) {
      if (!config.operations.risks.some((risk) => risk.id === riskId)) errors.push(`operations.${scenario.id} references unknown risk ${riskId}`)
    }
  }
  for (const policy of config.policies.items) {
    if (policy.conditions.length !== 17) errors.push(`policies.${policy.id} must contain 17 conditions`)
  }
  return errors
}
