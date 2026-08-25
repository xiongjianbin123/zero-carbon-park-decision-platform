<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import VppWorkbench from '@/components/operations/VppWorkbench.vue'
import { parkConfig } from '@/config/park'
import type { OperationTimelinePoint, OperationView, ResourceBuildStatus } from '@/types/park'

const props = withDefaults(defineProps<{ initialView?: OperationView }>(), { initialView: 'overview' })
const operations = parkConfig.operations
const selectedScenarioId = ref(operations.scenarios[0].id)
const activeView = ref<OperationView>(props.initialView)

const viewOptions: { id: OperationView; label: string; eyebrow: string }[] = [
  { id: 'overview', label: '源网荷储态势', eyebrow: 'ENERGY FLOW' },
  { id: 'resources', label: '灵活资源池', eyebrow: 'RESOURCE POOL' },
  { id: 'vpp', label: 'VPP 虚拟电厂', eyebrow: 'AGGREGATION OS' },
  { id: 'market', label: '市场协同推演', eyebrow: 'MARKET VALUE' },
  { id: 'risks', label: '运行风险与行动', eyebrow: 'RISK TO ACTION' },
]

const currentScenario = computed(() => operations.scenarios.find((item) => item.id === selectedScenarioId.value)!)
const currentRisks = computed(() => currentScenario.value.riskIds.map((id) => operations.risks.find((risk) => risk.id === id)!))

const statusLabels: Record<ResourceBuildStatus, string> = {
  planned: '规划中',
  building: '建设中',
  operating: '已建成',
}

const statusTones: Record<ResourceBuildStatus, string> = {
  planned: 'pink',
  building: 'orange',
  operating: 'green',
}

const series = [
  { key: 'load', label: '园区负荷', color: '#4eb8ff' },
  { key: 'pv', label: '光伏出力', color: '#7bd877' },
  { key: 'storage', label: '储能充放', color: '#f5a623' },
  { key: 'grid', label: '电网购电', color: '#00e5ff' },
] as const

function chartPoint(point: OperationTimelinePoint, index: number, key: typeof series[number]['key']) {
  const x = 35 + index * (730 / 23)
  const y = 226 - ((point[key] + 22) / 182) * 188
  return { x, y }
}

function seriesPoints(key: typeof series[number]['key']) {
  return currentScenario.value.timeline.map((point, index) => {
    const coordinate = chartPoint(point, index, key)
    return `${coordinate.x.toFixed(1)},${coordinate.y.toFixed(1)}`
  }).join(' ')
}
</script>

<template>
  <div class="page operations-page" data-page="operations">
    <PageHeading index="06" title="园区能源运营与市场协同" subtitle="SOURCE · GRID · LOAD · STORAGE OPERATIONS" conclusion="把五年建设成果转换为每一天可观察、可调节、可参与市场的园区运营能力。">
      <div class="operations-boundary"><span class="status-dot tone-orange" /> 规划与演示推演数据</div>
    </PageHeading>

    <section class="dual-clock" aria-label="建设阶段与日内运行双时间尺度">
      <div class="program-clock">
        <span>建设时钟</span>
        <div>
          <i v-for="year in parkConfig.roadmap.years" :key="year.year" :class="`state-${year.status}`"><b>{{ year.year }}</b><small>{{ year.title }}</small></i>
        </div>
      </div>
      <div class="operation-clock">
        <span>运行时钟</span>
        <div><i v-for="hour in ['00', '04', '08', '12', '16', '20', '24']" :key="hour"><b>{{ hour }}:00</b></i></div>
      </div>
    </section>

    <div class="scenario-bar" data-testid="scenario-summary">
      <div>
        <small>当前推演场景</small>
        <strong>{{ currentScenario.name }} · {{ currentScenario.label }}</strong>
        <span>{{ currentScenario.weather }}</span>
      </div>
      <p>{{ currentScenario.summary }}</p>
      <div class="scenario-switch" aria-label="运行场景">
        <button v-for="scenario in operations.scenarios" :key="scenario.id" class="data-button" :class="{ 'is-active': selectedScenarioId === scenario.id }" :data-scenario-id="scenario.id" @click="selectedScenarioId = scenario.id">
          <span>{{ scenario.name }}</span><small>{{ scenario.label }}</small>
        </button>
      </div>
    </div>

    <div class="metrics-grid">
      <MetricCard v-for="item in currentScenario.metrics" :key="`${currentScenario.id}-${item.id}`" :metric="item" />
    </div>

    <nav class="operation-tabs" aria-label="能源运营业务视图">
      <button v-for="item in viewOptions" :key="item.id" class="data-button" :class="{ 'is-active': activeView === item.id }" :data-operation-view="item.id" @click="activeView = item.id">
        <small>{{ item.eyebrow }}</small><strong>{{ item.label }}</strong>
      </button>
    </nav>

    <div v-if="activeView === 'overview'" class="operation-overview" data-testid="operation-view">
      <TechPanel title="24 小时源网荷储协同曲线" eyebrow="DAY-AHEAD OPERATION PROFILE">
        <div class="chart-legend"><span v-for="item in series" :key="item.key"><i :style="{ background: item.color }" />{{ item.label }}</span><b>储能：正值放电 / 负值充电</b></div>
        <svg class="energy-chart" data-testid="energy-chart" viewBox="0 0 800 260" role="img" :aria-label="`${currentScenario.name}24小时能源运行曲线`">
          <g class="chart-grid">
            <line v-for="y in [38, 85, 132, 179, 226]" :key="y" x1="35" :y1="y" x2="765" :y2="y" />
            <line v-for="x in [35, 156, 278, 400, 522, 643, 765]" :key="x" :x1="x" y1="38" :x2="x" y2="226" />
          </g>
          <line class="zero-line" x1="35" y1="203" x2="765" y2="203" />
          <polyline v-for="item in series" :key="item.key" :points="seriesPoints(item.key)" :stroke="item.color" />
          <circle v-for="(point, index) in currentScenario.timeline" :key="point.hour" data-hour-point :cx="chartPoint(point, index, 'load').x" :cy="chartPoint(point, index, 'load').y" r="2.4" />
          <g class="chart-labels"><text v-for="(point, index) in currentScenario.timeline.filter((_, index) => index % 4 === 0)" :key="point.hour" :x="35 + index * (730 / 23)" y="249">{{ point.hour }}</text></g>
        </svg>
      </TechPanel>

      <div class="overview-side">
        <TechPanel title="协同关系" eyebrow="OPERATING HUB">
          <div class="operation-hub">
            <svg viewBox="0 0 430 220" aria-hidden="true"><path d="M215 110L70 44M215 110L360 44M215 110L70 176M215 110L360 176"/><circle cx="215" cy="110" r="65"/></svg>
            <div class="operation-core"><span>日内调度</span><strong>园区运营中枢</strong><small>预测 · 协同 · 校核</small></div>
            <div class="flow-node node-source"><b>源</b><span>光伏 {{ currentScenario.timeline[12].pv }}MW</span></div>
            <div class="flow-node node-grid"><b>网</b><span>峰值购电 {{ Math.max(...currentScenario.timeline.map((item) => item.grid)) }}MW</span></div>
            <div class="flow-node node-load"><b>荷</b><span>峰值 {{ currentScenario.metrics[0].display }}MW</span></div>
            <div class="flow-node node-storage"><b>储</b><span>规划 100MW</span></div>
          </div>
        </TechPanel>
        <TechPanel title="当前场景调度策略" eyebrow="RECOMMENDED DISPATCH">
          <div class="strategy-list"><article v-for="(item, index) in currentScenario.strategy" :key="item"><span>0{{ index + 1 }}</span><p>{{ item }}</p></article></div>
        </TechPanel>
      </div>
    </div>

    <div v-else-if="activeView === 'resources'" class="resources-view" data-testid="operation-view">
      <TechPanel title="园区灵活资源池" eyebrow="BUILD STATUS · AVAILABLE CAPACITY">
        <div class="resource-grid">
          <article v-for="resource in operations.resources" :key="resource.id" :class="`tone-${resource.tone}`">
            <header><span>{{ resource.type }}</span><b :class="`tone-${statusTones[resource.status]}`">{{ statusLabels[resource.status] }}</b></header>
            <h3>{{ resource.name }}</h3>
            <strong>{{ resource.scale }}</strong>
            <div><span>可调容量</span><b>{{ resource.adjustableCapacity }}MW</b></div>
            <div><span>在线率</span><b>{{ resource.status === 'operating' ? `${resource.onlineRate}%` : '投运后统计' }}</b></div>
            <RouterLink v-if="resource.projectId" to="/projects">查看对应项目 →</RouterLink>
          </article>
        </div>
      </TechPanel>
      <TechPanel title="能力形成判断" eyebrow="PLANNED VS AVAILABLE">
        <div class="readiness-stack">
          <article><span>当前可调用</span><strong class="tone-green">50MW</strong><p>来自工业柔性负荷和充电设施，仍需通过实测确认履约能力。</p></article>
          <article><span>建设形成中</span><strong class="tone-orange">62MW</strong><p>分布式光伏和智慧能源中心正在形成监测与绿电消纳能力。</p></article>
          <article><span>规划待落地</span><strong class="tone-pink">100MW / 200MWh</strong><p>共享储能当前不能计入真实可调度资产。</p></article>
        </div>
      </TechPanel>
    </div>

    <VppWorkbench v-else-if="activeView === 'vpp'" :vpp="operations.vpp" />

    <div v-else-if="activeView === 'market'" class="market-view" data-testid="operation-view">
      <article v-for="channel in operations.marketChannels" :key="channel.id" class="market-card" :class="`tone-${channel.tone}`">
        <header><small>{{ channel.window }}</small><h2>{{ channel.name }}</h2></header>
        <div class="market-value"><span>可用基础</span><strong>{{ channel.availableCapacity }}</strong></div>
        <div class="market-value"><span>推演价值</span><strong>{{ channel.estimatedValue }}</strong></div>
        <section><small>参与约束</small><p>{{ channel.constraint }}</p></section>
        <section><small>建议策略</small><p>{{ channel.recommendation }}</p></section>
      </article>
      <TechPanel title="市场协同结论" eyebrow="VALUE WITH CONSTRAINTS" class-name="market-conclusion">
        <div class="market-summary"><strong>先形成可验证的资源能力，再扩大交易规模。</strong><p>当前最成熟的是重点企业柔性负荷；储能和光伏收益仍依赖项目建设、接入复核和真实运行曲线。</p><RouterLink to="/investment">查看投资与资金约束 →</RouterLink></div>
      </TechPanel>
    </div>

    <div v-else class="risks-view" data-testid="operation-view">
      <TechPanel title="运行风险与行动" eyebrow="RISK · OWNER · DEADLINE · ACTION">
        <div class="risk-action-list">
          <article v-for="(risk, index) in currentRisks" :key="risk.id" :class="`level-${risk.level}`">
            <div class="risk-number">0{{ index + 1 }}</div>
            <div class="risk-copy"><span>{{ risk.level === 'high' ? '重点风险' : risk.level === 'medium' ? '持续关注' : '一般提示' }}</span><h3>{{ risk.title }}</h3><p>{{ risk.impact }}</p></div>
            <div><small>责任单位</small><strong>{{ risk.owner }}</strong></div>
            <div><small>处理期限</small><strong>{{ risk.deadline }}</strong></div>
            <div class="risk-action"><small>下一项行动</small><strong>{{ risk.action }}</strong></div>
          </article>
        </div>
      </TechPanel>
      <div class="risk-links"><RouterLink to="/projects">进入全过程项目地图</RouterLink><RouterLink to="/qa">向智能问数继续追问</RouterLink></div>
    </div>
  </div>
</template>

<style scoped>
.operations-boundary { display: flex; align-items: center; gap: 7px; color: #8db3c8; }
.dual-clock { min-height: 86px; display: grid; grid-template-columns: 1.15fr .85fr; border: 1px solid rgba(0,229,255,.18); background: linear-gradient(90deg, rgba(12,45,83,.72), rgba(5,24,50,.78)); }
.program-clock, .operation-clock { padding: 12px 16px; display: grid; grid-template-columns: 78px 1fr; gap: 12px; align-items: center; }.program-clock { border-right: 1px dashed rgba(0,229,255,.2); }.program-clock > span, .operation-clock > span { color: var(--energy-cyan); font: 11px var(--font-data); letter-spacing: 1px; }.program-clock > div, .operation-clock > div { display: flex; position: relative; justify-content: space-between; }.program-clock > div::before, .operation-clock > div::before { content: ''; position: absolute; left: 3%; right: 3%; top: 12px; height: 1px; background: linear-gradient(90deg, var(--success-green), var(--energy-cyan), #315a79); }.program-clock i, .operation-clock i { min-width: 48px; position: relative; z-index: 1; font-style: normal; text-align: center; }.program-clock i::before, .operation-clock i::before { content: ''; width: 7px; height: 7px; display: block; margin: 9px auto 6px; border-radius: 50%; background: #315a79; box-shadow: 0 0 0 4px #0b294d; }.program-clock .state-completed::before { background: var(--success-green); }.program-clock .state-active::before { background: var(--energy-cyan); box-shadow: 0 0 10px var(--energy-cyan); }.program-clock b, .operation-clock b { display: block; color: white; font: 11px var(--font-data); }.program-clock small { color: #7198ae; font-size: 10px; }
.scenario-bar { min-height: 92px; padding: 12px 14px; display: grid; grid-template-columns: 260px 1fr auto; gap: 18px; align-items: center; border: 1px solid rgba(0,229,255,.18); background: rgba(7,28,57,.62); }.scenario-bar > div:first-child small, .scenario-bar > div:first-child strong, .scenario-bar > div:first-child span { display: block; }.scenario-bar > div:first-child small { color: #658ba3; }.scenario-bar > div:first-child strong { color: white; font-size: 17px; margin: 3px 0; }.scenario-bar > div:first-child span { color: var(--success-green); font-size: 11px; }.scenario-bar > p { color: #8fb3c6; line-height: 1.6; margin: 0; }.scenario-switch { display: flex; gap: 7px; }.scenario-switch button { min-width: 112px; padding: 9px 12px; text-align: left; }.scenario-switch span, .scenario-switch small { display: block; }.scenario-switch span { color: white; font-weight: 700; }.scenario-switch small { color: #658ca4; margin-top: 3px; }
.operation-tabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }.operation-tabs button { min-height: 56px; padding: 9px 13px; text-align: left; }.operation-tabs small, .operation-tabs strong { display: block; }.operation-tabs small { color: #5f879e; font: 9px var(--font-data); letter-spacing: 1px; }.operation-tabs strong { color: #a9c6d4; margin-top: 4px; }.operation-tabs .is-active strong { color: white; }
.operation-overview { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(360px, .75fr); gap: 14px; }.overview-side { display: grid; gap: 14px; }.chart-legend { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }.chart-legend span { display: flex; align-items: center; gap: 6px; color: #8eb0c2; font-size: 12px; }.chart-legend i { width: 16px; height: 2px; box-shadow: 0 0 6px currentColor; }.chart-legend b { margin-left: auto; color: #698fa6; font-size: 10px; font-weight: 400; }.energy-chart { width: 100%; min-height: 315px; margin-top: 10px; overflow: visible; }.chart-grid line { stroke: rgba(92,157,190,.13); stroke-width: 1; }.zero-line { stroke: rgba(245,166,35,.32); stroke-dasharray: 5 5; }.energy-chart polyline { fill: none; stroke-width: 2.3; vector-effect: non-scaling-stroke; filter: drop-shadow(0 0 3px currentColor); }.energy-chart circle { fill: #4eb8ff; opacity: .75; }.chart-labels text { fill: #698da3; font: 9px var(--font-data); text-anchor: middle; }
.operation-hub { min-height: 225px; position: relative; }.operation-hub svg { position: absolute; inset: 0; width: 100%; height: 100%; }.operation-hub path, .operation-hub circle { fill: none; stroke: rgba(0,229,255,.28); stroke-dasharray: 5 5; }.operation-core { position: absolute; left: 50%; top: 50%; width: 126px; height: 126px; transform: translate(-50%,-50%); display: grid; place-content: center; text-align: center; border: 1px solid var(--energy-cyan); border-radius: 50%; background: radial-gradient(circle, #0c4569, #081d3c 72%); box-shadow: 0 0 24px rgba(0,229,255,.17); }.operation-core span { color: var(--energy-cyan); font: 10px var(--font-data); }.operation-core strong { color: white; font-size: 14px; margin: 5px 0; }.operation-core small { color: #6e96ac; }.flow-node { position: absolute; display: grid; grid-template-columns: 30px 1fr; align-items: center; gap: 7px; }.flow-node b { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; border: 1px solid currentColor; }.flow-node span { color: #92b3c3; font-size: 11px; }.node-source { left: 0; top: 18px; color: var(--success-green); }.node-grid { right: 0; top: 18px; color: var(--electric-blue); }.node-load { left: 0; bottom: 18px; color: var(--energy-cyan); }.node-storage { right: 0; bottom: 18px; color: var(--opportunity-orange); }.strategy-list { display: grid; gap: 8px; }.strategy-list article { display: grid; grid-template-columns: 29px 1fr; gap: 8px; align-items: start; padding: 9px; border-left: 1px solid rgba(245,166,35,.45); background: rgba(245,166,35,.04); }.strategy-list span { color: var(--opportunity-orange); font: 11px var(--font-data); }.strategy-list p { margin: 0; color: #a8c4d1; line-height: 1.55; }
.resources-view { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(340px, .65fr); gap: 14px; }.resource-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }.resource-grid article { min-height: 190px; padding: 14px; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); background: linear-gradient(145deg, color-mix(in srgb, currentColor 8%, #0a1a3a), #071a37); }.resource-grid header, .resource-grid article > div { display: flex; justify-content: space-between; gap: 10px; }.resource-grid header span { color: currentColor; font-size: 11px; }.resource-grid header b { font-size: 11px; }.resource-grid h3 { color: white; font-size: 16px; margin: 13px 0 6px; }.resource-grid article > strong { color: currentColor; font: 700 22px var(--font-data); }.resource-grid article > div { margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(115,152,182,.18); color: #789fb3; font-size: 12px; }.resource-grid article > div b { color: #bdd3dd; }.resource-grid a { display: inline-block; margin-top: 12px; color: var(--energy-cyan); text-decoration: none; font-size: 12px; }.readiness-stack { display: grid; gap: 12px; }.readiness-stack article { padding: 14px; border-left: 2px solid rgba(0,229,255,.35); background: rgba(5,24,50,.4); }.readiness-stack span { color: #789eb1; }.readiness-stack strong { display: block; font: 800 23px var(--font-data); margin: 7px 0; }.readiness-stack p { color: #8eafbf; line-height: 1.6; margin: 0; }
.market-view { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }.market-card { min-height: 360px; padding: 17px; border: 1px solid color-mix(in srgb, currentColor 26%, transparent); background: linear-gradient(155deg, color-mix(in srgb, currentColor 8%, #102752), #071831 75%); }.market-card header { padding-bottom: 13px; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); }.market-card small { color: currentColor; font: 10px var(--font-data); letter-spacing: 1px; }.market-card h2 { color: white; font-size: 22px; margin: 7px 0 0; }.market-value { margin-top: 14px; }.market-value span, .market-value strong { display: block; }.market-value span { color: #6d95aa; font-size: 11px; }.market-value strong { color: currentColor; font: 700 21px var(--font-data); margin-top: 4px; }.market-card section { margin-top: 15px; padding: 11px; background: rgba(3,17,37,.43); }.market-card section p { color: #9bb8c6; line-height: 1.6; margin: 6px 0 0; }.market-conclusion { grid-column: 1 / 4; }.market-summary { display: grid; grid-template-columns: 1fr 1.6fr auto; gap: 18px; align-items: center; }.market-summary strong { color: white; font-size: 17px; }.market-summary p { color: #8fb1c1; margin: 0; line-height: 1.55; }.market-summary a { color: var(--energy-cyan); text-decoration: none; }
.risks-view { display: grid; gap: 12px; }.risk-action-list { display: grid; gap: 9px; }.risk-action-list article { min-height: 104px; display: grid; grid-template-columns: 52px 1.45fr 1fr 130px 1.35fr; gap: 12px; align-items: center; padding: 12px; border: 1px solid rgba(0,229,255,.14); background: rgba(5,24,50,.46); }.risk-action-list article.level-high { border-left: 2px solid var(--risk-pink); }.risk-action-list article.level-medium { border-left: 2px solid var(--opportunity-orange); }.risk-number { color: var(--energy-cyan); font: 700 14px var(--font-data); }.risk-copy span { color: var(--risk-pink); font-size: 10px; }.risk-copy h3 { color: white; font-size: 15px; margin: 4px 0; }.risk-copy p { color: #789fb2; margin: 0; line-height: 1.45; }.risk-action-list article > div small, .risk-action-list article > div strong { display: block; }.risk-action-list article > div small { color: #648ba1; }.risk-action-list article > div strong { color: #b8d0dc; margin-top: 5px; font-size: 12px; line-height: 1.45; }.risk-action strong { color: var(--success-green) !important; }.risk-links { display: flex; justify-content: flex-end; gap: 9px; }.risk-links a { padding: 9px 13px; color: var(--energy-cyan); text-decoration: none; border: 1px solid rgba(0,229,255,.28); background: rgba(0,229,255,.05); }
@media (max-width: 1280px) { .operation-overview, .resources-view { grid-template-columns: 1fr; }.overview-side { grid-template-columns: repeat(2, 1fr); }.risk-action-list article { grid-template-columns: 45px 1.5fr 1fr 1fr; }.risk-action { grid-column: 2 / 5; }.market-summary { grid-template-columns: 1fr; } }
</style>
