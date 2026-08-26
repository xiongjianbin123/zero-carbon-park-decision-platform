export const INDICATOR_VERSION = 'p0.1' as const

export const INDICATOR_DEFINITIONS = [
  {
    key: 'data_completeness',
    title: '基础数据完整度',
    unit: '%',
    targetValue: 100,
    direction: 'higher',
    requiredImports: ['energy_monthly', 'load_curve', 'enterprises', 'projects'],
  },
  {
    key: 'green_electricity_share',
    title: '绿电消费占比',
    unit: '%',
    targetValue: 90,
    direction: 'higher',
    requiredImports: ['energy_monthly'],
  },
  {
    key: 'load_peak_valley_ratio',
    title: '负荷峰谷比',
    unit: '倍',
    targetValue: 1.5,
    direction: 'lower',
    requiredImports: ['load_curve'],
  },
  {
    key: 'renewable_capacity',
    title: '可再生能源项目容量',
    unit: 'MW',
    targetValue: 1,
    direction: 'higher',
    requiredImports: ['projects'],
  },
  {
    key: 'enterprise_energy_coverage',
    title: '企业能耗数据覆盖率',
    unit: '%',
    targetValue: 100,
    direction: 'higher',
    requiredImports: ['enterprises'],
  },
  {
    key: 'project_investment_readiness',
    title: '项目投资数据完整率',
    unit: '%',
    targetValue: 100,
    direction: 'higher',
    requiredImports: ['projects'],
  },
] as const

export type IndicatorKey = (typeof INDICATOR_DEFINITIONS)[number]['key']
export type IndicatorStatus = 'achieved' | 'gap' | 'missing_data' | 'not_applicable'

