import type {
  ConditionStatus,
  Metric,
  ParkConfig,
  PolicyCondition,
  ProjectNode,
  Tone,
} from '../types/park'

const metric = (id: string, label: string, value: number, unit: string, tone: Tone, note = ''): Metric => ({
  id,
  label,
  value,
  display: Number.isInteger(value) ? String(value) : value.toFixed(1),
  unit,
  tone,
  note,
})

const lifecycleLabels = [
  ['planning', '项目策划'], ['approval', '项目立项'], ['filing', '备案'], ['feasibility', '可研'],
  ['site', '规划选址'], ['land', '土地'], ['environment', '环评'], ['energy', '能评'],
  ['grid-access', '电网接入'], ['design', '初步设计'], ['funding', '资金落实'], ['procurement', '招标采购'],
  ['construction', '施工建设'], ['connection', '并网'], ['acceptance', '验收'], ['operation', '运营'],
] as const

function createLifecycle(activeIndex: number, riskIndex = -1): ProjectNode[] {
  return lifecycleLabels.map(([id, label], index) => ({
    id,
    label,
    status: index < activeIndex ? 'completed' : index === riskIndex ? 'risk' : index === activeIndex ? 'active' : 'pending',
    owner: id === 'grid-access'
      ? '园区管委会 / 供电公司发展部'
      : id === 'funding' ? '园区财政金融部 / 项目公司' : '园区建设发展部 / 项目单位',
    requiredMaterials: id === 'grid-access'
      ? ['接入系统设计报告', '一次接线方案', '储能充放电曲线', '负荷预测说明', '电能质量评估', '保护配置方案', '调度通信方案', '产权分界说明']
      : [`${label}申请文件`, `${label}技术说明`, `${label}审批附件`],
    completedMaterials: id === 'grid-access'
      ? ['接入系统设计报告', '负荷预测说明', '电能质量评估', '保护配置方案', '调度通信方案', '产权分界说明']
      : index <= activeIndex ? [`${label}申请文件`, `${label}技术说明`] : [],
    missingMaterials: id === 'grid-access' ? ['一次接线方案', '储能充放电曲线'] : index === activeIndex ? [`${label}审批附件`] : [],
    risk: id === 'grid-access' ? '220kV 变电站预留间隔不足，原接入方案存在延期风险。' : index === activeIndex ? `${label}跨部门资料尚未闭环。` : '当前无新增重大风险。',
    recommendation: id === 'grid-access' ? '同步论证 110kV 接入备选方案，并在 10 个工作日内补齐两项技术材料。' : index === activeIndex ? `由责任单位牵头完成${label}材料会审。` : '按计划推进并保留审批证据。',
  }))
}

const conditionLabels = [
  '园区依法设立且边界清晰', '主导产业符合申报方向', '近三年无重大环保事故', '已建立园区能源管理机制',
  '具备完整企业和项目清单', '具备年度综合能耗数据', '具备可再生能源资源条件', '明确零碳建设实施主体',
  '形成分年度建设任务', '形成投资与资金方案', '明确减排目标和核算边界', '具备数字化能源平台基础',
  '重点企业参与机制明确', '项目具备土地和接入条件', '完成园区能源审计报告', '完成基准年碳排放核算',
  '重点项目可研已批复',
]

function createConditions(statuses: ConditionStatus[]): PolicyCondition[] {
  return conditionLabels.map((label, index) => {
    const status = statuses[index] ?? 'missing'
    return {
      id: `condition-${index + 1}`,
      label,
      status,
      note: status === 'met' ? '已有材料支撑' : status === 'pending' ? '需补充专项证明材料' : '尚未形成正式成果文件',
    }
  })
}

const statuses = (met: number, pending: number): ConditionStatus[] => [
  ...Array<ConditionStatus>(met).fill('met'),
  ...Array<ConditionStatus>(pending).fill('pending'),
  ...Array<ConditionStatus>(17 - met - pending).fill('missing'),
]

function createOperationTimeline(load: number[], pv: number[], storage: number[]) {
  return load.map((value, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    load: value,
    pv: pv[hour],
    storage: storage[hour],
    grid: Math.max(0, value - pv[hour] - storage[hour]),
  }))
}

export const parkConfig: Readonly<ParkConfig> = {
  meta: {
    platformName: '零碳园区全过程决策与申报咨询平台',
    parkName: '晋北资源型工业零碳示范园区',
    region: '山西省 · 晋北地区',
    industry: '煤化工 · 新材料 · 高端装备',
    baselineDate: '2026-08-25',
    demoLabel: '演示数据',
  },
  overview: {
    metrics: [
      metric('totalInvestment', '规划总投资', 67, '亿元', 'cyan', '2026—2030 规划口径'),
      metric('energyConsumption', '园区年用能', 8.2, '亿kWh', 'blue', '折算电量口径'),
      metric('greenPowerTarget', '目标绿电率', 43, '%', 'green', '2030 年目标'),
      metric('projectsAtRisk', '关键风险', 4, '项', 'pink', '需领导协调'),
      metric('annualReduction', '年减排潜力', 12, '万吨', 'green'),
      metric('pvPotential', '光伏开发潜力', 62, 'MW', 'cyan'),
      metric('energySavingPotential', '节能潜力', 11, '%', 'orange'),
    ],
    hubNodes: [
      { id: 'pv', label: '分布式光伏', value: '62MW', icon: '光', tone: 'cyan' },
      { id: 'storage', label: '新型储能', value: '100MW / 200MWh', icon: '储', tone: 'orange' },
      { id: 'green-power', label: '绿电采购缺口', value: '1.7亿kWh', icon: '电', tone: 'blue' },
      { id: 'efficiency', label: '工业节能潜力', value: '11%', icon: '效', tone: 'green' },
      { id: 'carbon', label: '年减排潜力', value: '12万吨', icon: '碳', tone: 'pink' },
    ],
    signals: [
      { id: 'grid-risk', category: 'risk', title: '接入容量待复核', detail: '220kV 间隔不足，需同步论证 110kV 备选方案', tone: 'pink' },
      { id: 'policy-window', category: 'opportunity', title: '政策申报窗口开启', detail: '国家级零碳园区试点匹配度 92%', tone: 'orange' },
      { id: 'reduction-space', category: 'achievement', title: '减排潜力可释放', detail: '预计形成 12 万吨/年减排能力', tone: 'green' },
      { id: 'capital-risk', category: 'risk', title: '社会资本仍有缺口', detail: '6 个项目合计待落实资金 18.6 亿元', tone: 'pink' },
    ],
  },
  roadmap: {
    metrics: [
      metric('roadmapPv', '光伏规划', 62, 'MW', 'cyan'),
      metric('storageEnergy', '储能规划', 200, 'MWh', 'orange'),
      metric('roadmapSaving', '节能潜力', 11, '%', 'green'),
      metric('roadmapReduction', '年减排', 12, '万吨', 'pink'),
    ],
    years: [
      { year: 2026, title: '摸清底数', status: 'completed', summary: '完成能源审计、企业用能画像和园区碳盘查边界确认。', projects: ['园区能源审计', '重点企业碳盘查', '零碳总体规划'], contribution: '形成 2025 基准年和 23 个重点项目底表。' },
      { year: 2027, title: '光储先行', status: 'active', summary: '集中建设分布式光伏与共享储能，解决绿电消纳和峰谷调节。', projects: ['62MW 分布式光伏', '100MW/200MWh 储能', '110kV 接入改造'], contribution: '绿电率提升至 28%，年减排约 5.2 万吨。' },
      { year: 2028, title: '市场协同', status: 'pending', summary: '开展绿电交易、需求响应和虚拟电厂聚合运营。', projects: ['绿电交易中心', '需求响应改造', '园区 VPP'], contribution: '新增绿电采购 1.1 亿 kWh，形成灵活负荷 80MW。' },
      { year: 2029, title: '深度节能', status: 'pending', summary: '面向煤化工、新材料和装备企业实施工艺、电机与余热改造。', projects: ['高效电机替换', '余热余压利用', '能效对标平台'], contribution: '综合能耗强度较基准年下降 9%。' },
      { year: 2030, title: '验收达标', status: 'pending', summary: '完成碳管理闭环、绩效核验和国家级零碳园区申报验收。', projects: ['碳管理平台', '绩效核验', '示范园区验收'], contribution: '绿电率达到 43%，综合节能潜力释放 11%。' },
    ],
    technologyMix: [
      { id: 'renewable', label: '新能源', value: 34, unit: '%', tone: 'cyan' },
      { id: 'storage', label: '储能调节', value: 24, unit: '%', tone: 'orange' },
      { id: 'efficiency', label: '工业能效', value: 22, unit: '%', tone: 'green' },
      { id: 'carbon', label: '碳管理', value: 20, unit: '%', tone: 'pink' },
    ],
  },
  projects: {
    metrics: [
      metric('projectsNormal', '正常推进', 7, '项', 'green'),
      metric('projectsCoordinating', '待协调', 12, '项', 'orange'),
      metric('projectsWarning', '重点预警', 4, '项', 'pink'),
      metric('materialCompletion', '材料完整率', 76, '%', 'cyan'),
    ],
    items: [
      { id: 'storage-demo', name: '共享储能示范项目', category: '新型储能', investment: 9, currentNodeId: 'grid-access', progress: 38, status: 'risk', nodes: createLifecycle(8, 8) },
      { id: 'distributed-pv', name: '62MW 分布式光伏项目', category: '新能源', investment: 5.2, currentNodeId: 'procurement', progress: 69, status: 'active', nodes: createLifecycle(11) },
      { id: 'energy-center', name: '园区智慧能源中心', category: '数字能源', investment: 1.8, currentNodeId: 'feasibility', progress: 25, status: 'active', nodes: createLifecycle(3) },
      { id: 'efficiency-upgrade', name: '重点企业节能改造包', category: '工业节能', investment: 8, currentNodeId: 'planning', progress: 12, status: 'active', nodes: createLifecycle(0) },
    ],
  },
  policies: {
    metrics: [
      metric('policyCount', '政策机会', 7, '项', 'cyan'),
      metric('policyBestMatch', '最高匹配', 92, '%', 'green'),
      metric('policyWindow', '申报窗口', 46, '天', 'orange'),
      metric('policyGaps', '材料缺口', 3, '项', 'pink'),
    ],
    items: [
      { id: 'zero-carbon-pilot', name: '国家级零碳园区试点', match: 92, support: '政策支持与要素倾斜', deadline: '2026-10-10', level: 3, reasons: ['产业基础与资源型转型主题契合', '已形成 67 亿元项目储备', '源网荷储与工业节能路径完整'], conditions: createConditions(statuses(14, 2)) },
      { id: 'energy-saving-fund', name: '节能降碳专项资金', match: 86, support: '预计 5.0 亿元', deadline: '2026-09-30', level: 3, reasons: ['重点企业节能量可核算', '工业节能项目已形成清单', '项目投资主体基本明确'], conditions: createConditions(statuses(13, 3)) },
      { id: 'special-treasury', name: '超长期特别国债', match: 78, support: '金额待专项测算', deadline: '年度滚动申报', level: 4, reasons: ['项目具有公共基础设施属性', '储能和电网改造带动效应明显', '需进一步落实资本金和审批手续'], conditions: createConditions(statuses(12, 4)) },
      { id: 'green-demo', name: '绿色低碳示范项目', match: 74, support: '预计 2.0 亿元', deadline: '2026-11-15', level: 2, reasons: ['减排场景丰富', '数字化平台基础较好', '示范复制方案需要深化'], conditions: createConditions(statuses(12, 4)) },
    ],
  },
  investment: {
    metrics: [
      metric('investmentTotal', '规划总投资', 67, '亿元', 'cyan'),
      metric('confirmedCapital', '主体已明确', 31, '亿元', 'green'),
      metric('specialFunding', '专项资金空间', 9.4, '亿元', 'orange'),
      metric('fundingGap', '资金缺口', 18.6, '亿元', 'pink'),
    ],
    sectors: [
      { id: 'renewable', name: '新能源', amount: 18, tone: 'cyan', scale: '62MW 光伏及园区外绿电基地', components: [{ label: '分布式光伏', amount: 5.2 }, { label: '风电权益合作', amount: 4.5 }, { label: '绿电基地及配套', amount: 8.3 }] },
      { id: 'storage', name: '新型储能', amount: 9, tone: 'orange', scale: '100MW / 200MWh', components: [{ label: '电芯及电池系统', amount: 3.8 }, { label: 'PCS', amount: 1.1 }, { label: 'EMS/BMS', amount: 0.5 }, { label: '升压系统', amount: 1.4 }, { label: '土建与设计', amount: 1.2 }, { label: '并网及其他', amount: 1 }] },
      { id: 'grid', name: '电网改造', amount: 6, tone: 'blue', scale: '110kV 接入与园区配网升级', components: [{ label: '变电站改造', amount: 3.2 }, { label: '线路工程', amount: 1.8 }, { label: '保护通信', amount: 1 }] },
      { id: 'efficiency', name: '工业节能', amount: 8, tone: 'green', scale: '17 家重点企业改造', components: [{ label: '工艺节能', amount: 3.4 }, { label: '高效电机', amount: 2.1 }, { label: '余热余压', amount: 2.5 }] },
      { id: 'hydrogen', name: '氢能示范', amount: 12, tone: 'pink', scale: '绿氢制储运与场景应用', components: [{ label: '制氢系统', amount: 5.2 }, { label: '储运系统', amount: 3.1 }, { label: '应用场景', amount: 3.7 }] },
      { id: 'platform', name: '智慧能源平台', amount: 1.8, tone: 'cyan', scale: '园区能源与碳管理中枢', components: [{ label: '感知采集', amount: 0.6 }, { label: '平台软件', amount: 0.8 }, { label: '运营服务', amount: 0.4 }] },
      { id: 'infrastructure', name: '基础设施', amount: 7, tone: 'blue', scale: '管网、道路和综合能源站', components: [{ label: '综合能源站', amount: 3 }, { label: '园区管网', amount: 2.4 }, { label: '配套工程', amount: 1.6 }] },
      { id: 'other', name: '其他项目', amount: 5.2, tone: 'green', scale: '碳汇、咨询及预备费', components: [{ label: '生态碳汇', amount: 1.2 }, { label: '咨询设计', amount: 1 }, { label: '建设预备费', amount: 3 }] },
    ],
    fundingSources: [
      { id: 'social', name: '社会资本', amount: 18, tone: 'cyan', status: 'confirmed' },
      { id: 'state-owned', name: '央国企投资', amount: 13, tone: 'blue', status: 'confirmed' },
      { id: 'banks', name: '政策性银行与绿色贷款', amount: 14, tone: 'green', status: 'potential' },
      { id: 'special', name: '财政与专项资金', amount: 3.4, tone: 'orange', status: 'potential' },
      { id: 'gap', name: '待落实资金', amount: 18.6, tone: 'pink', status: 'gap' },
    ],
  },
  operations: {
    scenarios: [
      {
        id: 'typical-day',
        name: '典型日',
        label: '常规生产负荷',
        weather: '晴 · 18—29℃',
        summary: '光伏午间承担主要增量，储能在晚高峰释放调节能力，园区运行保持平稳。',
        metrics: [
          metric('operationPeak', '园区峰值负荷', 118, 'MW', 'blue', '18:00 预测峰值'),
          metric('operationGreenRate', '当日绿电占比', 31.6, '%', 'green', '光伏与绿电交易合计'),
          metric('operationFlexible', '可调节容量', 80, 'MW', 'cyan', '储能与柔性负荷'),
          metric('operationValue', '当日运营价值', 18.6, '万元', 'orange', '演示推演口径'),
        ],
        timeline: createOperationTimeline(
          [72, 68, 65, 64, 66, 72, 84, 96, 104, 108, 110, 106, 101, 98, 99, 104, 111, 116, 118, 112, 103, 94, 86, 78],
          [0, 0, 0, 0, 0, 2, 8, 18, 31, 43, 52, 58, 60, 57, 49, 36, 21, 8, 1, 0, 0, 0, 0, 0],
          [-12, -14, -16, -15, -12, -6, 0, 0, 0, -4, -8, -10, -8, -5, 0, 3, 12, 21, 28, 25, 18, 8, 0, -5],
        ),
        strategy: ['00:00—05:00 利用低谷电价补充储能', '10:00—14:00 优先消纳园区光伏', '17:00—21:00 释放储能并组织柔性负荷响应'],
        riskIds: ['grid-access', 'forecast-bias'],
      },
      {
        id: 'summer-peak',
        name: '迎峰度夏',
        label: '高温高负荷日',
        weather: '高温 · 27—38℃',
        summary: '制冷与连续生产负荷叠加，晚高峰电网购电压力显著，需要储能和柔性负荷联合削峰。',
        metrics: [
          metric('operationPeak', '园区峰值负荷', 148, 'MW', 'pink', '19:00 预测峰值'),
          metric('operationGreenRate', '当日绿电占比', 26.4, '%', 'green', '负荷增长稀释绿电占比'),
          metric('operationFlexible', '可调节容量', 92, 'MW', 'cyan', '启用备用响应资源'),
          metric('operationValue', '当日运营价值', 32.8, '万元', 'orange', '演示推演口径'),
        ],
        timeline: createOperationTimeline(
          [88, 84, 82, 80, 82, 90, 104, 118, 127, 133, 137, 139, 136, 134, 136, 141, 145, 147, 148, 148, 143, 132, 116, 101],
          [0, 0, 0, 0, 0, 2, 9, 20, 34, 47, 56, 61, 62, 59, 51, 38, 22, 9, 1, 0, 0, 0, 0, 0],
          [-16, -18, -20, -20, -16, -9, 0, 0, -5, -9, -12, -12, -10, -6, 0, 5, 16, 28, 36, 40, 34, 20, 7, -6],
        ),
        strategy: ['00:00—05:00 分批充电并保留 15% 应急容量', '17:00 前将储能 SOC 提升至 85%', '18:00—21:00 启动 12MW 工业柔性负荷响应'],
        riskIds: ['grid-access', 'response-performance', 'storage-readiness'],
      },
      {
        id: 'production-peak',
        name: '生产高峰',
        label: '重点企业集中开工',
        weather: '多云 · 16—25℃',
        summary: '工业负荷全天维持高位，光伏出力偏低，应优先保障生产并控制需量成本。',
        metrics: [
          metric('operationPeak', '园区峰值负荷', 136, 'MW', 'blue', '14:00 预测峰值'),
          metric('operationGreenRate', '当日绿电占比', 22.8, '%', 'green', '多云导致本地光伏下降'),
          metric('operationFlexible', '可调节容量', 74, 'MW', 'cyan', '生产约束降低可调空间'),
          metric('operationValue', '当日运营价值', 24.2, '万元', 'orange', '演示推演口径'),
        ],
        timeline: createOperationTimeline(
          [91, 88, 86, 85, 87, 94, 106, 118, 126, 130, 132, 134, 135, 135, 136, 134, 132, 131, 129, 125, 118, 109, 101, 95],
          [0, 0, 0, 0, 0, 1, 5, 12, 21, 29, 35, 38, 39, 37, 31, 23, 14, 5, 1, 0, 0, 0, 0, 0],
          [-10, -12, -14, -14, -10, -5, 0, 0, 0, -3, -6, -7, -5, 0, 5, 9, 16, 22, 25, 22, 14, 6, 0, -4],
        ),
        strategy: ['06:00 前完成生产高峰前的储能补能', '11:00—15:00 控制企业最大需量', '优先调用不影响连续工艺的辅助负荷'],
        riskIds: ['forecast-bias', 'response-performance'],
      },
    ],
    resources: [
      { id: 'distributed-pv-resource', name: '62MW 分布式光伏', type: '新能源', scale: '62MW', adjustableCapacity: 0, status: 'building', onlineRate: 0, tone: 'cyan', projectId: 'distributed-pv' },
      { id: 'shared-storage-resource', name: '共享储能示范项目', type: '新型储能', scale: '100MW / 200MWh', adjustableCapacity: 100, status: 'planned', onlineRate: 0, tone: 'orange', projectId: 'storage-demo' },
      { id: 'industrial-load-resource', name: '重点企业柔性负荷', type: '工业负荷', scale: '17 家重点企业', adjustableCapacity: 42, status: 'operating', onlineRate: 94, tone: 'blue' },
      { id: 'charging-resource', name: '园区充电设施集群', type: '充电设施', scale: '168 个终端', adjustableCapacity: 8, status: 'operating', onlineRate: 97, tone: 'green' },
      { id: 'energy-center-resource', name: '园区智慧能源中心', type: '数字能源', scale: '1 套运营中枢', adjustableCapacity: 0, status: 'building', onlineRate: 0, tone: 'pink', projectId: 'energy-center' },
    ],
    marketChannels: [
      { id: 'demand-response', name: '需求响应', window: '迎峰度夏 / 省级邀约', availableCapacity: '42MW', estimatedValue: '8.6 万元/次', constraint: '连续工艺负荷不可中断，需提前确认企业基线。', recommendation: '优先聚合空压、制冷、泵类和非连续生产负荷。', tone: 'cyan' },
      { id: 'spot-market', name: '现货交易', window: '日前 + 日内', availableCapacity: '100MW 储能规划容量', estimatedValue: '12.4 万元/典型日', constraint: '储能尚处规划阶段，收益仅作为投资推演。', recommendation: '以价格预测、寿命成本和接入约束联合优化。', tone: 'orange' },
      { id: 'green-power', name: '绿电交易', window: '年度长协 + 月度补充', availableCapacity: '1.7 亿kWh 缺口', estimatedValue: '支撑 43% 绿电目标', constraint: '需避免环境权益重复计算并统一核算边界。', recommendation: '优先锁定中长期框架，再由月度交易校正偏差。', tone: 'green' },
    ],
    risks: [
      { id: 'grid-access', level: 'high', title: '储能接入容量仍待复核', impact: '影响共享储能项目规模、开工时间和市场可用容量。', owner: '园区管委会 / 供电公司发展部', deadline: '10 个工作日', action: '同步论证 220kV 与 110kV 两套接入方案。' },
      { id: 'forecast-bias', level: 'medium', title: '负荷预测缺少真实企业曲线', impact: '峰值需量、储能策略和交易收益存在偏差。', owner: '园区能源管理部门 / 重点企业', deadline: '30 个工作日', action: '接入 17 家重点企业 15 分钟负荷数据并校准典型日。' },
      { id: 'response-performance', level: 'medium', title: '柔性负荷履约能力尚未实测', impact: '需求响应申报容量可能高于真实可执行能力。', owner: '园区运营主体 / 重点企业', deadline: '首次申报前', action: '开展一次不低于 60 分钟的联合响应演练。' },
      { id: 'storage-readiness', level: 'high', title: '储能尚未形成可调度资产', impact: '迎峰度夏场景中的储能收益和削峰能力均为规划值。', owner: '项目公司 / 建设发展部', deadline: '并网验收后', action: '设备投运后以实测效率、SOC 和寿命成本重算策略。' },
    ],
    vpp: {
      readiness: 62,
      metrics: [
        metric('vppAggregatedAssets', '聚合资源', 19, '组', 'cyan', '17 家企业 + 2 类设施'),
        metric('vppAvailableCapacity', '当前可调', 50, 'MW', 'green', '柔性负荷与充电设施'),
        metric('vppResponseCapacity', '待验证容量', 42, 'MW', 'pink', '需完成联合响应演练'),
        metric('vppScenarioValue', '典型日价值', 18.6, '万元', 'orange', '演示推演口径'),
      ],
      stages: [
        { id: 'aggregation', label: '资源聚合', eyebrow: 'RESOURCE AGGREGATION', tone: 'cyan', status: '部分可用', headlineLabel: '当前可聚合', headlineValue: '50MW', summary: '把分散的工业负荷、充电设施和规划储能形成可管理的资源池。', rows: [
          { label: '重点企业柔性负荷', value: '17 家 / 42MW', detail: '空压、制冷、泵类及非连续工艺', status: '已建模' },
          { label: '园区充电设施', value: '168 终端 / 8MW', detail: '按充电时段和离场需求分组', status: '可调试' },
          { label: '共享储能', value: '100MW / 200MWh', detail: '项目尚在规划阶段', status: '待建设' },
        ], action: '先完成 17 家企业 15 分钟负荷数据接入和可调边界确认。' },
        { id: 'forecast', label: '负荷预测', eyebrow: 'LOAD FORECAST', tone: 'blue', status: '待校准', headlineLabel: '典型日峰值', headlineValue: '118MW', summary: '联合生产计划、天气、光伏出力和历史曲线生成日前可调空间。', rows: [
          { label: '园区负荷峰值', value: '118MW', detail: '预计 18:00 出现', status: '演示预测' },
          { label: '光伏出力峰值', value: '60MW', detail: '预计 12:00 出现', status: '演示预测' },
          { label: '目标预测偏差', value: '±8.5%', detail: '待真实曲线接入后校准', status: '待验证' },
        ], action: '按企业、负荷类型建立基线，避免统一比例削减造成履约偏差。' },
        { id: 'response', label: '需求响应', eyebrow: 'DEMAND RESPONSE', tone: 'green', status: '待演练', headlineLabel: '可申报基础', headlineValue: '42MW', summary: '按企业生产约束组合响应资源包，管理邀约、基线、履约和恢复。', rows: [
          { label: '迎峰度夏资源包', value: '42MW', detail: '优先非连续生产负荷', status: '待演练' },
          { label: '最小响应时长', value: '60 分钟', detail: '第一次联合演练目标', status: '待确认' },
          { label: '预计单次价值', value: '8.6 万元', detail: '需按实际规则与履约率结算', status: '推演' },
        ], action: '组织一次不低于 60 分钟的园区联合响应演练。' },
        { id: 'trading', label: '交易策略', eyebrow: 'MARKET BIDDING', tone: 'orange', status: '推演中', headlineLabel: '日前交易申报', headlineValue: '18MW', summary: '将可调容量、价格预测、寿命成本和生产约束合并为市场申报策略。', rows: [
          { label: '日前交易申报', value: '18MW', detail: '18:00—21:00 峰时段推演', status: '待审核' },
          { label: '需求响应申报', value: '42MW', detail: '按省级邀约窗口组包', status: '待邀约' },
          { label: '绿电补充空间', value: '1.7 亿kWh', detail: '年度长协与月度偏差修正', status: '待签约' },
        ], action: '先形成可验证的资源能力，再根据山西市场规则扩大申报规模。' },
        { id: 'dispatch', label: '执行监控', eyebrow: 'DISPATCH CONTROL', tone: 'pink', status: '方案待执行', headlineLabel: '待执行指令', headlineValue: '3条', summary: '把交易或响应目标拆分到资源组，持续监视功率、SOC、履约偏差和生产边界。', rows: [
          { label: '储能备用计划', value: '17:00 SOC 85%', detail: '储能建成后才可执行', status: '规划中' },
          { label: '柔性负荷指令', value: '12MW', detail: '18:00—21:00 按组下发', status: '待演练' },
          { label: '履约偏差门限', value: '±10%', detail: '超限自动转入备用资源', status: '待配置' },
        ], action: '执行前必须确认企业生产边界和现场控制权限。' },
        { id: 'settlement', label: '收益结算', eyebrow: 'REVENUE SETTLEMENT', tone: 'green', status: '口径待校核', headlineLabel: '收益结算', headlineValue: '18.6万元', summary: '按市场品种归集电能、响应、绿电与偏差成本，形成园区与企业分摊依据。', rows: [
          { label: '典型日运营价值', value: '18.6 万元', detail: '光伏消纳、储能削峰与响应合计', status: '推演' },
          { label: '单次响应收益', value: '8.6 万元', detail: '未扣除偏差和企业分成', status: '推演' },
          { label: '偏差与考核', value: '待实际规则', detail: '接入正式市场规则后计算', status: '待校核' },
        ], action: '先统一园区、企业与运营主体的收益分配和环境权益口径。' },
      ],
    },
  },
  qa: [
    { id: 'total-investment', question: '整个园区需要投资多少钱？', conclusion: '2026—2030 年规划总投资为 67.0 亿元，新能源和氢能是最大的两个投资板块。', highlights: [{ label: '规划总投资', value: '67.0 亿元', tone: 'cyan' }, { label: '新能源', value: '18.0 亿元', tone: 'green' }], reasons: ['八类投资板块已逐项拆解', '新能源、氢能和储能合计占比最高', '资金来源同步按 67 亿元闭合'], action: '将项目拆分为近期启动包和中期储备包。', evidence: ['零碳项目投资估算表 V1.2', '资金拼图方案 V1.0', '园区项目库'], metricRefs: ['totalInvestment', 'investmentTotal'] },
    { id: 'funding-gap', question: '哪些项目还没有落实资金？', conclusion: '当前 6 个项目存在资金缺口，合计约 18.6 亿元，储能、工业节能和能源中心优先级最高。', highlights: [{ label: '资金缺口', value: '18.6 亿元', tone: 'pink' }, { label: '涉及项目', value: '6 个', tone: 'orange' }], reasons: ['社会资本和央国企已明确 31 亿元', '金融机构资金尚需结合现金流审批', '专项申报材料仍有 3 项缺口'], action: '优先锁定储能投资主体并补齐申报材料。', evidence: ['项目清单 V1.2', '资金方案表', '投融资专题会纪要'], metricRefs: ['fundingGap', 'confirmedCapital', 'policyGaps'] },
    { id: 'why-storage', question: '为什么需要建设 200MWh 储能？', conclusion: '200MWh 储能用于承接 62MW 光伏波动、削峰填谷并支撑约 80MW 灵活负荷参与市场。', highlights: [{ label: '储能规模', value: '100MW / 200MWh', tone: 'orange' }, { label: '光伏潜力', value: '62MW', tone: 'cyan' }], reasons: ['峰谷价差具备两小时储能经济性', '光伏与工业负荷存在时段错配', 'VPP 需要可调节资源'], action: '同步复核 220kV 与 110kV 两套接入方案。', evidence: ['典型日负荷曲线', '光伏消纳测算表', '储能初步方案'], metricRefs: ['storageEnergy', 'pvPotential'] },
    { id: 'best-policy', question: '最适合申报哪项政策？', conclusion: '国家级零碳园区试点匹配度最高，为 92%，但仍需补齐能源审计、碳盘查和重点项目可研。', highlights: [{ label: '最高匹配', value: '92%', tone: 'green' }, { label: '材料缺口', value: '3 项', tone: 'pink' }], reasons: ['园区产业与转型主题契合', '项目储备较完整', '基础材料完整度为 14/17'], action: '按 10 月 10 日窗口倒排材料编制。', evidence: ['政策机会池 V1.1', '申报条件核对表', '零碳建设路径'], metricRefs: ['policyBestMatch', 'policyGaps', 'policyWindow'] },
    { id: 'carbon-reduction', question: '建成后能降低多少碳排放？', conclusion: '规划项目全部落地后预计形成约 12 万吨/年的减排能力。', highlights: [{ label: '年减排潜力', value: '12 万吨', tone: 'green' }], reasons: ['绿电替代贡献约 55%', '工业节能贡献约 28%', '储能和运营优化贡献约 17%'], action: '完成基准年碳盘查后进行第三方复核。', evidence: ['减排潜力测算表', '园区能源平衡表', '零碳路线图'], metricRefs: ['annualReduction', 'roadmapReduction'] },
    { id: 'green-power', question: '2030 年绿电比例能达到多少？', conclusion: '按当前项目组合，2030 年园区绿电率目标为 43%。', highlights: [{ label: '目标绿电率', value: '43%', tone: 'green' }], reasons: ['本地 62MW 光伏先行', '补充园区外绿电', '储能和 VPP 提高消纳率'], action: '优先签订中长期绿电框架协议。', evidence: ['绿电供需平衡表', '光伏资源普查', '绿电交易策略'], metricRefs: ['greenPowerTarget', 'pvPotential'] },
    { id: 'key-risk', question: '当前最需要领导协调的风险是什么？', conclusion: '最紧迫的是储能项目电网接入和 18.6 亿元资金缺口，两项均影响 2027 年光储建设。', highlights: [{ label: '关键风险', value: '4 项', tone: 'pink' }, { label: '资金缺口', value: '18.6 亿元', tone: 'orange' }], reasons: ['220kV 预留间隔不足', '储能投资主体未最终锁定', '两项基础报告在编'], action: '组织供电、金融和项目公司联合专题会。', evidence: ['风险台账', '接入专题纪要', '资金方案表'], metricRefs: ['projectsAtRisk', 'fundingGap'] },
    { id: 'project-progress', question: '重点项目整体推进到什么程度？', conclusion: '23 个项目中 7 项正常推进、12 项待协调、4 项重点预警，材料完整率为 76%。', highlights: [{ label: '正常推进', value: '7 项', tone: 'green' }, { label: '重点预警', value: '4 项', tone: 'pink' }], reasons: ['光伏已进入招采', '储能卡在接入方案', '能源中心可研在编'], action: '对四项预警项目实行周调度。', evidence: ['全过程项目地图', '周调度台账', '材料清单'], metricRefs: ['projectsNormal', 'projectsCoordinating', 'projectsWarning', 'materialCompletion'] },
    { id: 'special-funding', question: '预计能争取多少政策资金？', conclusion: '当前可识别专项资金空间约 9.4 亿元，其中 7 亿元已有明确政策方向。', highlights: [{ label: '专项空间', value: '9.4 亿元', tone: 'orange' }], reasons: ['节能降碳专项预计 5 亿元', '绿色示范预计 2 亿元', '其余需按批次测算'], action: '采用一项目一政策包避免重复申报。', evidence: ['政策资金测算表', '申报机会池', '投资估算表'], metricRefs: ['specialFunding', 'policyCount'] },
    { id: 'energy-saving', question: '工业节能还有多大空间？', conclusion: '重点企业综合节能潜力约 11%，优先实施工艺、电机和余热余压改造。', highlights: [{ label: '节能潜力', value: '11%', tone: 'green' }, { label: '投资需求', value: '8 亿元', tone: 'orange' }], reasons: ['17 家企业覆盖主要能耗', '电机改造周期短', '余热项目贡献稳定'], action: '先选 3 家企业开展投资级能源审计。', evidence: ['能效对标表', '节能项目清单', '能源审计计划'], metricRefs: ['energySavingPotential', 'roadmapSaving'] },
    { id: 'next-quarter', question: '下一季度必须完成哪些工作？', conclusion: '必须完成储能接入方案、能源审计与碳盘查、零碳园区申报初稿三项工作。', highlights: [{ label: '关键任务', value: '3 项', tone: 'cyan' }, { label: '申报窗口', value: '46 天', tone: 'orange' }], reasons: ['共同决定 2027 年能否开工', '申报窗口不能后移', '接入影响储能可研'], action: '建立主任牵头的周调度机制。', evidence: ['季度行动清单', '申报倒排计划', '风险台账'], metricRefs: ['policyWindow', 'projectsAtRisk'] },
    { id: 'data-readiness', question: '当前申报材料准备得怎么样？', conclusion: '国家级零碳园区试点材料已满足 14/17 项，两项待补，一项缺失。', highlights: [{ label: '满足条件', value: '14 / 17', tone: 'green' }, { label: '缺口', value: '3 项', tone: 'pink' }], reasons: ['基础与产业材料齐备', '能源审计正在编制', '重点项目可研未批'], action: '建立责任人、来源文件和审定状态台账。', evidence: ['申报条件核对表', '材料目录 V0.9', '报告计划'], metricRefs: ['policyGaps', 'materialCompletion'] },
    { id: 'operation-value', question: '源网荷储协同能给园区带来什么价值？', conclusion: '在典型日演示场景下，园区可通过光伏消纳、储能削峰和柔性负荷响应形成约 18.6 万元的当日运营价值。', highlights: [{ label: '可调容量', value: '80MW', tone: 'cyan' }, { label: '推演价值', value: '18.6 万元', tone: 'orange' }], reasons: ['午间光伏优先供给园区负荷', '储能在晚高峰释放调节能力', '柔性工业负荷可参与需求响应'], action: '先完成企业负荷采集和储能接入复核，再以真实曲线校准收益。', evidence: ['能源运营典型日场景', '灵活资源池', '市场协同推演'], metricRefs: ['operationFlexible', 'operationValue'] },
  ],
  tour: [
    { route: '/dashboard', page: '园区驾驶舱', conclusion: '园区已形成 67 亿元零碳项目储备，但接入和资金是当前两项核心约束。', talkingPoints: ['先看能源与碳底数', '再看项目机会和关键风险', '所有数字均可下钻追溯'] },
    { route: '/roadmap', page: '零碳建设路径', conclusion: '转型是从摸底、光储、市场、节能到验收的五年路径。', talkingPoints: ['2027 年光储先行', '2028 年进入绿电和 VPP 运营', '2030 年完成零碳验收'] },
    { route: '/projects', page: '全过程项目地图', conclusion: '每个项目都落实到审批节点、责任单位、材料缺口和处置建议。', talkingPoints: ['储能当前卡在接入', '两项技术材料未补齐', '同步论证 110kV 备选方案'] },
    { route: '/policies', page: '政策与申报中心', conclusion: '国家级零碳园区试点匹配度最高，当前材料完整度为 14/17。', talkingPoints: ['政策机会自动排序', '匹配理由可解释', '三项材料倒排完成'] },
    { route: '/investment', page: '投资与资金地图', conclusion: '67 亿元已拆到八类板块，当前明确资金缺口为 18.6 亿元。', talkingPoints: ['投资可逐级下钻', '资金来源与总投资闭合', '优先保障 2027 年项目'] },
    { route: '/operations', page: '能源运营', conclusion: '规划中的光伏、储能和柔性负荷将共同形成园区运行与市场协同能力。', talkingPoints: ['长期建设映射到日内运行', '三类市场价值统一推演', '规划值与已建成能力分开展示'] },
    { route: '/qa', page: '智能问数', conclusion: '项目、政策、能源、运营和资金信息可统一查询，并关联相应资料来源。', talkingPoints: ['常用问题快速查看', '政策与园区数据联合分析', '可继续查看相关资料'] },
  ],
}
