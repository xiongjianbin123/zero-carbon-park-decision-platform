import type { Tone } from '@/types/park'

export interface ViewMetric {
  label: string
  value: string
  unit: string
  tone: Tone
  note?: string
}

export interface BenchmarkIndicator {
  id: string
  label: string
  kind: string
  target: string
  value: string
  status: 'pending' | 'gap'
  note: string
  progress?: number
  threshold?: number
}

export const policyViewMetrics: Record<string, ViewMetric[]> = {
  library: [
    { label: '政策资料', value: '19', unit: '份', tone: 'cyan' },
    { label: '国家政策', value: '11', unit: '份', tone: 'blue' },
    { label: '山西能源政策', value: '4', unit: '份', tone: 'green' },
    { label: '技术标准与导则', value: '4', unit: '份', tone: 'orange', note: '状态可辨' },
  ],
  benchmark: [
    { label: '申报材料准备', value: '14/17', unit: '项', tone: 'green' },
    { label: '核心指标', value: '待核算', unit: '', tone: 'orange', note: '基准年口径' },
    { label: '清洁能源占比', value: '43%', unit: '', tone: 'pink', note: '目标不低于 90%' },
    { label: '优先补齐', value: '3', unit: '项', tone: 'orange' },
  ],
  shanxi: [
    { label: '园区光伏潜力', value: '62', unit: 'MW', tone: 'cyan' },
    { label: '共享储能规划', value: '100/200', unit: 'MW/MWh', tone: 'orange' },
    { label: '可调节负荷', value: '80', unit: 'MW', tone: 'blue' },
    { label: '绿电采购缺口', value: '1.7', unit: '亿kWh', tone: 'pink' },
  ],
  radar: [
    { label: '近期政策动态', value: '6', unit: '条', tone: 'cyan' },
    { label: '高影响变化', value: '2', unit: '条', tone: 'pink' },
    { label: '申报窗口', value: '1', unit: '项', tone: 'orange', note: '进行中' },
    { label: '已关联项目', value: '9', unit: '项', tone: 'green' },
  ],
}

export const applicationStages = [
  { id: 'qualification', label: '园区资格确认', note: '依法设立、边界与实施主体', status: 'done' },
  { id: 'baseline', label: '基准年碳盘查', note: '能源活动与工业过程排放', status: 'active' },
  { id: 'indicators', label: '建设指标测算', note: '核心指标与五项引导指标', status: 'pending' },
  { id: 'projects', label: '重点项目论证', note: '可行性与综合效益测算', status: 'pending' },
  { id: 'application', label: '建设方案编制', note: '任务、投资、进度与保障机制', status: 'pending' },
  { id: 'review', label: '审核推荐', note: '市级审核与省级推荐', status: 'pending' },
] as const

export const benchmarkIndicators: BenchmarkIndicator[] = [
  { id: 'carbon-per-energy', label: '单位能耗碳排放', kind: '核心指标', target: '按综合能耗分档', value: '待核算', status: 'pending', note: '完成基准年能源平衡表后测算适用门槛。' },
  { id: 'clean-energy', label: '清洁能源消费占比', kind: '引导指标', target: '不低于 90%', value: '43%', status: 'gap', progress: 43, threshold: 90, note: '差距 47 个百分点。' },
  { id: 'solid-waste', label: '工业固体废弃物综合利用率', kind: '引导指标', target: '不低于 80%', value: '待录入', status: 'pending', note: '补录重点企业年度固废产生量与综合利用量。' },
  { id: 'waste-energy', label: '余热余冷余压综合利用率', kind: '引导指标', target: '不低于 50%', value: '待录入', status: 'pending', note: '补录可回收资源量、已利用量和改造项目。' },
  { id: 'water-reuse', label: '工业用水重复利用率', kind: '引导指标', target: '不低于 80%', value: '待录入', status: 'pending', note: '补录园区取水、排水和循环利用数据。' },
]

export const applicationGaps = [
  { priority: '最高优先级', due: '2026-09-15', title: '完成基准年碳排放核算', detail: '闭合能源消费、外购电热和工业过程活动数据。', owner: '园区能源管理中心' },
  { priority: '关键前置', due: '2026-09-30', title: '重点项目可研与效益测算', detail: '统一投资、减排量、建设周期及资金来源口径。', owner: '建设发展部 / 项目公司' },
  { priority: '指标支撑', due: '2026-09-20', title: '形成绿电供需平衡方案', detail: '补充园区内开发、园区外采购、储能调节与交易安排。', owner: '管委会 / 供电公司' },
] as const

export const shanxiScenes = [
  { icon: '直', title: '绿电直连', detail: '一对一、一对多供电组织', tone: 'cyan' },
  { icon: '储', title: '新型储能', detail: '共享储能、独立储能与长时储能', tone: 'orange' },
  { icon: '聚', title: '虚拟电厂', detail: '负荷与储能资源聚合入市', tone: 'green' },
  { icon: '市', title: '电力市场', detail: '现货、辅助服务与需求响应', tone: 'blue' },
  { icon: '证', title: '绿电与绿证', detail: '采购、交易、认证与产品碳足迹', tone: 'pink' },
  { icon: '碳', title: '能碳管理', detail: '能源流、碳数据流与产品流', tone: 'cyan' },
] as const

export const shanxiPolicyLinks = [
  { tag: '山西零碳园区建设', title: '绿电项目、配套储能和接入工程形成协同支持', detail: '用于组织园区建设任务、项目清单与省级支持条件。', related: '光伏、储能、电网接入', sourceUrl: 'https://wjw.shanxi.gov.cn/xwzx/szyw/202606/t20260618_10149609.shtml' },
  { tag: '山西新型储能发展', title: '支持源网荷储、虚拟电厂和低碳园区场景', detail: '进一步分析储能定位、市场收益和资源聚合方式。', related: '共享储能、VPP', sourceUrl: 'https://sxszfzgzb.shanxi.gov.cn/zshz/tzzc/202606/t20260608_10141806.shtml' },
  { tag: '山西能源转型部署', title: '绿电园区叠加直连、微电网和增量配电', detail: '结合周边风光资源、负荷特性与电网接入条件选型。', related: '绿电直连、园区配网', sourceUrl: 'https://sxszfzgzb.shanxi.gov.cn/zshz/tzzc/202605/t20260508_10117553.shtml' },
] as const

export const policyRadarEvents = [
  { date: '2026-06-18', tone: 'pink', impact: '高影响', title: '山西省零碳园区建设工作部署', detail: '明确省级园区建设、四年周期评估以及绿电直连、配套储能和电网接入支持方向。', sourceUrl: 'https://wjw.shanxi.gov.cn/xwzx/szyw/202606/t20260618_10149609.shtml' },
  { date: '2026-06-08', tone: 'orange', impact: '项目机会', title: '山西省新型储能高质量发展相关方案', detail: '拓展源网荷储、虚拟电厂、低碳园区等融合应用场景。', sourceUrl: 'https://sxszfzgzb.shanxi.gov.cn/zshz/tzzc/202606/t20260608_10141806.shtml' },
  { date: '2026-05-08', tone: 'cyan', impact: '持续跟踪', title: '山西能源转型重点任务更新', detail: '推进绿电园区、绿电直连、虚拟电厂和零低碳园区协同建设。', sourceUrl: 'https://sxszfzgzb.shanxi.gov.cn/zshz/tzzc/202605/t20260508_10117553.shtml' },
  { date: '2025-12-26', tone: 'green', impact: '对标案例', title: '首批国家级零碳园区建设名单公布', detail: '大同经开区和阳泉高新区进入首批建设名单，可形成省内对标样本。', sourceUrl: 'https://www.ndrc.gov.cn/xwdt/tzgg/202512/P020251226366590614561.pdf' },
] as const

export const parkImpactCards = [
  { title: '储能项目定位需同步复核', detail: '结合共享容量、虚拟电厂聚合和现货市场收益重新校核运营边界。', related: '共享储能示范项目' },
  { title: '绿电直连方案进入前置论证', detail: '把周边新能源资源、园区负荷、电网接入和交易组织统一测算。', related: '62MW 光伏与绿电采购' },
  { title: '申报材料增加省级政策支撑', detail: '把山西支持措施对应到项目清单、建设周期和资金安排。', related: '国家级零碳园区申报' },
] as const
