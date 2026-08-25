export type Tone = 'cyan' | 'blue' | 'green' | 'orange' | 'pink'
export type ProgressStatus = 'completed' | 'active' | 'pending' | 'risk'
export type ConditionStatus = 'met' | 'pending' | 'missing'

export interface Metric {
  id: string
  label: string
  value: number
  display: string
  unit: string
  tone: Tone
  note?: string
}

export interface HubNode {
  id: string
  label: string
  value: string
  icon: string
  tone: Tone
}

export interface SignalItem {
  id: string
  category: 'risk' | 'opportunity' | 'achievement'
  title: string
  detail: string
  tone: Tone
}

export interface RoadmapYear {
  year: number
  title: string
  status: ProgressStatus
  summary: string
  projects: string[]
  contribution: string
}

export interface TechnologyMix {
  id: string
  label: string
  value: number
  unit: string
  tone: Tone
}

export interface ProjectNode {
  id: string
  label: string
  status: ProgressStatus
  owner: string
  requiredMaterials: string[]
  completedMaterials: string[]
  missingMaterials: string[]
  risk: string
  recommendation: string
}

export interface ParkProject {
  id: string
  name: string
  category: string
  investment: number
  currentNodeId: string
  progress: number
  status: ProgressStatus
  nodes: ProjectNode[]
}

export interface PolicyCondition {
  id: string
  label: string
  status: ConditionStatus
  note: string
}

export interface PolicyOpportunity {
  id: string
  name: string
  match: number
  support: string
  deadline: string
  level: number
  reasons: string[]
  conditions: PolicyCondition[]
}

export interface InvestmentComponent {
  label: string
  amount: number
}

export interface InvestmentSector {
  id: string
  name: string
  amount: number
  tone: Tone
  scale: string
  components: InvestmentComponent[]
}

export interface FundingSource {
  id: string
  name: string
  amount: number
  tone: Tone
  status: 'confirmed' | 'potential' | 'gap'
}

export interface QaHighlight {
  label: string
  value: string
  tone: Tone
}

export interface QaItem {
  id: string
  question: string
  conclusion: string
  highlights: QaHighlight[]
  reasons: string[]
  action: string
  evidence: string[]
  metricRefs: string[]
}

export interface TourStop {
  route: string
  page: string
  conclusion: string
  talkingPoints: string[]
}

export type OperationView = 'overview' | 'resources' | 'vpp' | 'market' | 'risks'
export type ResourceBuildStatus = 'planned' | 'building' | 'operating'
export type VppStageId = 'aggregation' | 'forecast' | 'response' | 'trading' | 'dispatch' | 'settlement'

export interface OperationTimelinePoint {
  hour: string
  load: number
  pv: number
  storage: number
  grid: number
}

export interface OperationScenario {
  id: string
  name: string
  label: string
  weather: string
  summary: string
  metrics: Metric[]
  timeline: OperationTimelinePoint[]
  strategy: string[]
  riskIds: string[]
}

export interface OperationResource {
  id: string
  name: string
  type: string
  scale: string
  adjustableCapacity: number
  status: ResourceBuildStatus
  onlineRate: number
  tone: Tone
  projectId?: string
}

export interface MarketChannel {
  id: string
  name: string
  window: string
  availableCapacity: string
  estimatedValue: string
  constraint: string
  recommendation: string
  tone: Tone
}

export interface OperationRisk {
  id: string
  level: 'high' | 'medium' | 'low'
  title: string
  impact: string
  owner: string
  deadline: string
  action: string
}

export interface VppStageRow {
  label: string
  value: string
  detail: string
  status: string
}

export interface VppStage {
  id: VppStageId
  label: string
  eyebrow: string
  tone: Tone
  status: string
  headlineLabel: string
  headlineValue: string
  summary: string
  rows: VppStageRow[]
  action: string
}

export interface VppConfig {
  readiness: number
  metrics: Metric[]
  stages: VppStage[]
}

export interface ParkConfig {
  meta: {
    platformName: string
    parkName: string
    region: string
    industry: string
    baselineDate: string
    demoLabel: string
  }
  overview: {
    metrics: Metric[]
    hubNodes: HubNode[]
    signals: SignalItem[]
  }
  roadmap: {
    metrics: Metric[]
    years: RoadmapYear[]
    technologyMix: TechnologyMix[]
  }
  projects: {
    metrics: Metric[]
    items: ParkProject[]
  }
  policies: {
    metrics: Metric[]
    items: PolicyOpportunity[]
  }
  investment: {
    metrics: Metric[]
    sectors: InvestmentSector[]
    fundingSources: FundingSource[]
  }
  operations: {
    scenarios: OperationScenario[]
    resources: OperationResource[]
    marketChannels: MarketChannel[]
    risks: OperationRisk[]
    vpp: VppConfig
  }
  qa: QaItem[]
  tour: TourStop[]
}
